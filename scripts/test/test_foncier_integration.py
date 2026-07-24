#!/usr/bin/env python3
"""Integration tests for Foncier module: CREATE/READ/UPDATE/DELETE/ARCHIVE workflows.

Usage: PYTHONPATH=. .venv/bin/python3 scripts/test/test_foncier_integration.py
"""
from __future__ import annotations

import sys
from datetime import datetime
from pathlib import Path
from uuid import uuid4

from sqlalchemy import text

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from backend.app.core.database import SessionLocal


class FoncierIntegrationTests:
    def __init__(self):
        self.db = SessionLocal()
        self.test_results = []
        self.test_admin_id = str(uuid4())
        self.test_village_id = None
        self.test_lot_id = None
    
    def log(self, level: str, message: str):
        """Log test result."""
        self.test_results.append({"level": level, "message": message})
        emoji = {"PASS": "✓", "FAIL": "❌", "INFO": "ℹ"}[level]
        print(f"{emoji} {message}")
    
    def test_1_village_creation(self):
        """Test 1: Create a village."""
        try:
            village_id = str(uuid4())
            stmt = text("""
                INSERT INTO foncier_villages (id, nom, region, created_by)
                VALUES (:id, :nom, :region, :by)
                RETURNING id, nom, created_at
            """)
            result = self.db.execute(stmt, {
                "id": village_id,
                "nom": "Village Test",
                "region": "Yamoussoukro",
                "by": self.test_admin_id,
            })
            row = result.fetchone()
            if row:
                self.test_village_id = row[0]
                self.log("PASS", f"Village created: {row[1]} (ID: {self.test_village_id})")
                return True
        except Exception as e:
            self.log("FAIL", f"Village creation failed: {str(e)[:100]}")
        return False
    
    def test_2_village_read(self):
        """Test 2: Read village by ID."""
        try:
            stmt = text("SELECT id, nom, created_at FROM foncier_villages WHERE id = :id")
            result = self.db.execute(stmt, {"id": self.test_village_id})
            row = result.fetchone()
            if row:
                self.log("PASS", f"Village read: {row[1]} created at {row[2]}")
                return True
            else:
                self.log("FAIL", "Village not found after creation")
        except Exception as e:
            self.log("FAIL", f"Village read failed: {str(e)[:100]}")
        return False
    
    def test_3_lot_creation(self):
        """Test 3: Create a lot in the village."""
        try:
            lot_id = str(uuid4())
            reference = f"REF-{lot_id[:8].upper()}"
            stmt = text("""
                INSERT INTO foncier_lots (id, reference, village_id, numero_lot, superficie, statut, created_by)
                VALUES (:id, :ref, :vid, :num, :area, :stat, :by)
                RETURNING id, numero_lot, superficie
            """)
            result = self.db.execute(stmt, {
                "id": lot_id,
                "ref": reference,
                "vid": self.test_village_id,
                "num": "LOT-001",
                "area": 500.0,
                "stat": "disponible",
                "by": self.test_admin_id,
            })
            row = result.fetchone()
            if row:
                self.test_lot_id = row[0]
                self.log("PASS", f"Lot created: {row[1]} ({row[2]} m²)")
                return True
        except Exception as e:
            self.log("FAIL", f"Lot creation failed: {str(e)[:100]}")
        return False
    
    def test_4_lot_list(self):
        """Test 4: List lots for village."""
        try:
            stmt = text("""
                SELECT COUNT(*), COUNT(CASE WHEN statut='disponible' THEN 1 END) as disp
                FROM foncier_lots WHERE village_id = :vid AND deleted_at IS NULL
            """)
            result = self.db.execute(stmt, {"vid": self.test_village_id})
            row = result.fetchone()
            total, available = row[0], row[1]
            self.log("PASS", f"Lots count: {total} total, {available} available")
            return True
        except Exception as e:
            self.log("FAIL", f"Lot list failed: {str(e)[:100]}")
        return False
    
    def test_5_lot_update(self):
        """Test 5: Update lot statut."""
        try:
            stmt = text("""
                UPDATE foncier_lots SET statut = :stat, updated_at = NOW()
                WHERE id = :id
                RETURNING id, statut
            """)
            result = self.db.execute(stmt, {"id": self.test_lot_id, "stat": "reserve"})
            row = result.fetchone()
            if row:
                self.log("PASS", f"Lot updated: {row[0]} → {row[1]}")
                return True
        except Exception as e:
            self.log("FAIL", f"Lot update failed: {str(e)[:100]}")
        return False
    
    def test_6_lot_soft_delete(self):
        """Test 6: Soft delete (archive) a lot."""
        try:
            stmt = text("""
                UPDATE foncier_lots SET deleted_at = NOW(), updated_at = NOW()
                WHERE id = :id
                RETURNING id, deleted_at IS NOT NULL
            """)
            result = self.db.execute(stmt, {"id": self.test_lot_id})
            row = result.fetchone()
            if row and row[1]:
                self.log("PASS", f"Lot archived: {row[0]}")
                return True
        except Exception as e:
            self.log("FAIL", f"Lot archive failed: {str(e)[:100]}")
        return False
    
    def test_7_lot_restore(self):
        """Test 7: Restore archived lot."""
        try:
            stmt = text("""
                UPDATE foncier_lots SET deleted_at = NULL, updated_at = NOW()
                WHERE id = :id
                RETURNING id, deleted_at IS NULL
            """)
            result = self.db.execute(stmt, {"id": self.test_lot_id})
            row = result.fetchone()
            if row and row[1]:
                self.log("PASS", f"Lot restored: {row[0]}")
                return True
        except Exception as e:
            self.log("FAIL", f"Lot restore failed: {str(e)[:100]}")
        return False
    
    def test_8_village_hierarchy(self):
        """Test 8: Verify village hierarchy (if ensureHierarchy exists)."""
        try:
            stmt = text("""
                SELECT COUNT(DISTINCT village_id) as villages,
                       COUNT(*) as total_lots,
                       COUNT(CASE WHEN statut='disponible' THEN 1 END) as available
                FROM foncier_lots WHERE deleted_at IS NULL
            """)
            result = self.db.execute(stmt)
            row = result.fetchone()
            self.log("PASS", f"Hierarchy check: {row[0]} villages, {row[1]} lots, {row[2]} available")
            return True
        except Exception as e:
            self.log("FAIL", f"Hierarchy check failed: {str(e)[:100]}")
        return False
    
    def test_9_permissions_rls(self):
        """Test 9: Verify RLS policies exist on critical tables."""
        try:
            stmt = text("""
                SELECT COUNT(*) FROM pg_policies
                WHERE tablename IN ('foncier_lots', 'foncier_villages', 'foncier_attestations')
            """)
            result = self.db.execute(stmt)
            count = result.scalar()
            if count and count > 0:
                self.log("PASS", f"RLS policies found: {count} on Foncier tables")
                return True
            else:
                self.log("FAIL", "No RLS policies found on Foncier tables")
                return False
        except Exception as e:
            self.log("FAIL", f"RLS check failed: {str(e)[:100]}")
        return False
    
    def test_10_cleanup(self):
        """Test 10: Clean up test data."""
        try:
            # Delete test lot
            self.db.execute(text("DELETE FROM foncier_lots WHERE id = :id"), {"id": self.test_lot_id})
            # Delete test village
            self.db.execute(text("DELETE FROM foncier_villages WHERE id = :id"), {"id": self.test_village_id})
            self.db.commit()
            self.log("PASS", "Test data cleaned up")
            return True
        except Exception as e:
            self.db.rollback()
            self.log("FAIL", f"Cleanup failed: {str(e)[:100]}")
            return False
    
    def run_all(self):
        """Run all tests."""
        print("\n" + "=" * 80)
        print("FONCIER MODULE INTEGRATION TESTS")
        print("=" * 80 + "\n")
        
        tests = [
            self.test_1_village_creation,
            self.test_2_village_read,
            self.test_3_lot_creation,
            self.test_4_lot_list,
            self.test_5_lot_update,
            self.test_6_lot_soft_delete,
            self.test_7_lot_restore,
            self.test_8_village_hierarchy,
            self.test_9_permissions_rls,
            self.test_10_cleanup,
        ]
        
        results = []
        for test in tests:
            try:
                result = test()
                results.append(result)
            except Exception as e:
                self.log("FAIL", f"Test execution error: {str(e)[:100]}")
                results.append(False)
        
        self.db.close()
        
        # Summary
        passed = sum(1 for r in results if r)
        total = len(results)
        print(f"\n{'=' * 80}")
        print(f"SUMMARY: {passed}/{total} tests passed")
        print("=" * 80 + "\n")
        
        return passed == total


if __name__ == "__main__":
    tester = FoncierIntegrationTests()
    success = tester.run_all()
    sys.exit(0 if success else 1)
