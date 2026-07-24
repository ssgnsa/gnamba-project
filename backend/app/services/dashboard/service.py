from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from sqlalchemy import and_, func, select, text
from sqlalchemy.orm import Session

from app.models.user import (
    User,
    AuthSession,
    AuthAuditLog,
    AuthLoginFailure,
)
# Import other models as needed, but we'll use raw SQL for flexibility since
# the tables are defined via the generic table repository and may not have SQLAlchemy models.
# Alternatively, we can reflect the tables, but for simplicity we'll use raw SQL.

class DashboardService:
    def __init__(self, db: Session):
        self.db = db

    def get_dashboard_data(self) -> Dict[str, Any]:
        """
        Fetch and aggregate data for the dashboard.
        Returns a dictionary matching the DashboardData interface from the frontend.
        """
        # We'll compute the data using raw SQL queries for performance and simplicity.
        # Note: The table names are as defined in the generic table repository.

        # Helper to execute a query and return a single value or list.
        def query_one(sql: str, params: dict = None) -> Any:
            result = self.db.execute(text(sql), params or {})
            row = result.fetchone()
            return row[0] if row else None

        def query_all(sql: str, params: dict = None) -> List[Dict]:
            result = self.db.execute(text(sql), params or {})
            return [dict(row) for row in result.fetchall()]

        # Get current date for filtering
        now = datetime.now()
        current_month_start = datetime(now.year, now.month, 1)
        previous_month_start = (current_month_start - timedelta(days=1)).replace(day=1)
        six_months_ago = (current_month_start - timedelta(days=6*30)).replace(day=1)

        # 1. Financial data: recettes and depenses for current and previous month
        # We assume there is a 'finances' table (or similar) with type_transaction, montant, date_transaction, categorie
        # Since we don't have a SQLAlchemy model, we use the table name from the generic table repository.
        # Note: The generic table repository uses the table name as defined in TABLES in tables.py.
        # For finances, it's the 'finances' table (see TABLES in tables.py).

        # Current month recettes and depenses
        current_finance = query_all("""
            SELECT 
                type_transaction,
                SUM(montant) as total
            FROM finances
            WHERE date_transaction >= :start_date
            GROUP BY type_transaction
        """, {
            "start_date": current_month_start.strftime("%Y-%m-%d")
        })

        current_recettes = 0
        current_depenses = 0
        for item in current_finance:
            if item['type_transaction'] == 'recette':
                current_recettes = item['total']
            elif item['type_transaction'] == 'depense':
                current_depenses = item['total']

        # Previous month recettes and depenses
        previous_finance = query_all("""
            SELECT 
                type_transaction,
                SUM(montant) as total
            FROM finances
            WHERE date_transaction >= :start_date AND date_transaction < :end_date
            GROUP BY type_transaction
        """, {
            "start_date": previous_month_start.strftime("%Y-%m-%d"),
            "end_date": current_month_start.strftime("%Y-%m-%d")
        })

        previous_recettes = 0
        previous_depenses = 0
        for item in previous_finance:
            if item['type_transaction'] == 'recette':
                previous_recettes = item['total']
            elif item['type_transaction'] == 'depense':
                previous_depenses = item['total']

        # 2. Total clients (from clients table)
        total_clients = query_one("SELECT COUNT(*) FROM clients") or 0

        # 3. Active projects (from projects table, where statut != 'termine' or similar)
        projets_actifs = query_one("""
            SELECT COUNT(*) FROM projects 
            WHERE statut != 'termine' AND statut IS NOT NULL
        """) or 0

        # 4. Biens immobiliers (from properties table)
        biens_immobiliers = query_one("SELECT COUNT(*) FROM properties") or 0

        # 5. Loyers en attente (from rent_payments where statut in ('en_attente', 'retard', 'partiel'))
        loyers_en_attente = query_one("""
            SELECT COALESCE(SUM(montant), 0) FROM rent_payments
            WHERE statut IN ('en_attente', 'retard', 'partiel')
        """) or 0

        # 6. Tâches urgentes (from tasks where priorite = 'haute' and statut != 'termine')
        taches_urgentes = query_one("""
            SELECT COUNT(*) FROM tasks 
            WHERE priorite = 'haute' AND statut != 'termine'
        """) or 0

        # 7. Monthly aggregates (last 6 months)
        monthly = query_all("""
            SELECT 
                strftime('%m/%Y', date_transaction) as month,
                SUM(CASE WHEN type_transaction = 'recette' THEN montant ELSE 0 END) as recettes,
                SUM(CASE WHEN type_transaction = 'depense' THEN montant ELSE 0 END) as depenses
            FROM finances
            WHERE date_transaction >= :six_months_ago
            GROUP BY strftime('%m/%Y', date_transaction)
            ORDER BY month
        """, {
            "six_months_ago": six_months_ago.strftime("%Y-%m-%d")
        })

        # Format monthly data for the frontend (expects month as string like "Jan", "Feb", etc.)
        monthly_formatted = []
        for item in monthly:
            # Parse the month string (format: %m/%Y) to get month name
            try:
                dt = datetime.strptime(item['month'], "%m/%Y")
                month_label = dt.strftime("%b")  # Jan, Feb, etc.
            except ValueError:
                month_label = item['month']
            monthly_formatted.append({
                "month": month_label,
                "recettes": item['recettes'] or 0,
                "depenses": item['depenses'] or 0
            })

        # 8. Category aggregates (last 6 months)
        recettes_by_category = query_all("""
            SELECT 
                categorie,
                SUM(montant) as total
            FROM finances
            WHERE type_transaction = 'recette' AND date_transaction >= :six_months_ago
            GROUP BY categorie
            ORDER BY total DESC
        """, {
            "six_months_ago": six_months_ago.strftime("%Y-%m-%d")
        })

        depenses_by_category = query_all("""
            SELECT 
                categorie,
                SUM(montant) as total
            FROM finances
            WHERE type_transaction = 'depense' AND date_transaction >= :six_months_ago
            GROUP BY categorie
            ORDER BY total DESC
        """, {
            "six_months_ago": six_months_ago.strftime("%Y-%m-%d")
        })

        # Assign colors (we'll use the same palettes as in the frontend)
        CAT_COLORS_REC = ["#14b8a6", "#0ea5e9", "#22c55e", "#a3e635", "#f59e0b", "#e879f9"]
        CAT_COLORS_DEP = ["#f87171", "#fb923c", "#fbbf24", "#a78bfa", "#60a5fa", "#34d399"]

        recettes_by_category_formatted = [
            {
                "label": item['categorie'] or 'Autre',
                "value": item['total'] or 0,
                "color": CAT_COLORS_REC[i % len(CAT_COLORS_REC)]
            }
            for i, item in enumerate(recettes_by_category)
        ]

        depenses_by_category_formatted = [
            {
                "label": item['categorie'] or 'Autre',
                "value": item['total'] or 0,
                "color": CAT_COLORS_DEP[i % len(CAT_COLORS_DEP)]
            }
            for i, item in enumerate(depenses_by_category)
        ]

        # 9. Recent transactions (last 10 transactions, ordered by date)
        recent_transactions = query_all("""
            SELECT 
                id,
                type_transaction,
                description,
                categorie,
                montant,
                date_transaction
            FROM finances
            ORDER BY date_transaction DESC
            LIMIT 10
        """)

        # Format recent transactions for the frontend
        recent_transactions_formatted = [
            {
                "id": item['id'],
                "type_transaction": item['type_transaction'],
                "description": item['description'] or '',
                "categorie": item['categorie'] or '',
                "montant": item['montant'] or 0,
                "date_transaction": item['date_transaction']
            }
            for item in recent_transactions
        ]

        # 10. Alerts
        alerts = []
        if loyers_en_attente > 0:
            alerts.append({
                "id": "rents",
                "type": "warning",
                "message": f"{loyers_en_attente:,.0f} FCFA de loyers en attente",
                "sub": "Relancer les locataires concernés"
            })
        if taches_urgentes > 0:
            alerts.append({
                "id": "tasks",
                "type": "danger",
                "message": f"{taches_urgentes} tâche(s) urgente(s) non terminée(s)",
                "sub": "Vérifier le tableau des tâches"
            })
        if not alerts:
            alerts.append({
                "id": "health",
                "type": "success",
                "message": "Tout est en ordre",
                "sub": "Aucune alerte active"
            })

        # Benefice net
        benefice_net = current_recettes - current_depenses

        # Return the data in the format expected by the frontend
        return {
            "currentRecettes": current_recettes,
            "prevRecettes": previous_recettes,
            "currentDepenses": current_depenses,
            "prevDepenses": previous_depenses,
            "beneficeNet": benefice_net,
            "totalClients": total_clients,
            "projetsActifs": projets_actifs,
            "biensImmobiliers": biens_immobiliers,
            "loyersEnAttente": loyers_en_attente,
            "tachesUrgentes": taches_urgentes,
            "monthly": monthly_formatted,
            "recettesByCategory": recettes_by_category_formatted,
            "depensesByCategory": depenses_by_category_formatted,
            "recentTransactions": recent_transactions_formatted,
            "alerts": alerts
        }


    def get_transactions_for_period(self, start_date: datetime, end_date: datetime) -> List[Dict]:
        """
        Get financial transactions for a given period.
        Returns a list of dictionaries representing transactions.
        """
        def query_all(sql: str, params: dict = None) -> List[Dict]:
            result = self.db.execute(text(sql), params or {})
            return [dict(row) for row in result.fetchall()]

        sql = """
            SELECT 
                date_transaction,
                type_transaction,
                categorie,
                description,
                montant
            FROM finances
            WHERE date_transaction >= :start_date AND date_transaction < :end_date
            ORDER BY date_transaction DESC
        """
        return query_all(sql, {
            "start_date": start_date.strftime("%Y-%m-%d"),
            "end_date": end_date.strftime("%Y-%m-%d")
        })
