"""Data models."""

# Core models
from app.models.user import User, AuthSession, AuthAuditLog, AuthLoginFailure
from app.models.party import Party
from app.models.entity import Entity
from app.models.project import ProjectModel
from app.models.foncier import (
    FoncierVillage, FoncierLotissement, FoncierIlot, FoncierLot,
    FoncierAttestation, FoncierAttestationTemoin, UserVillageAccess, ActivityLog
)

# Media models
from app.models.media import MediaFile, MediaVersion, MediaUsage, MediaAuditLog

# Property/Immobilier models
from app.models.property import Property, LeaseContract, RentPayment, ImmobilierItem

# Leads/CRM models
from app.models.leads import Lead, LeadCampaign, LeadCapture, LeadInteraction, PartyLeadDetail, PartyRole

# HR/Employees models
from app.models.hr import Employee, Task, EmployeePresence, MessageDirection, EmployeePresenceStatus

# Finances models
from app.models.finances import Finances, Product, Supplier

# Public Website / Page Builder models
from app.models.public_site import PageLayout, SiteContent, SiteRealisation, VitrineLot, ContactMessage

# Visits/Stats models
from app.models.visits import Visiteur, VisiteDuJour, VisiteEnCours, ActiviteJournal, StatsJournalieres

# Settings/Config models
from app.models.settings import AppSettings, UserProfile

__all__ = [
    # Core
    "User", "AuthSession", "AuthAuditLog", "AuthLoginFailure", "Party", "Entity", "ProjectModel",
    "FoncierVillage", "FoncierLotissement", "FoncierIlot", "FoncierLot",
    "FoncierAttestation", "FoncierAttestationTemoin", "UserVillageAccess", "ActivityLog",
    
    # Media
    "MediaFile", "MediaVersion", "MediaUsage", "MediaAuditLog",
    
    # Property/Immobilier
    "Property", "LeaseContract", "RentPayment", "ImmobilierItem",
    
    # Leads/CRM
    "Lead", "LeadCampaign", "LeadCapture", "LeadInteraction", "PartyLeadDetail", "PartyRole",
    
    # HR/Employees
    "Employee", "Task", "EmployeePresence", "MessageDirection", "EmployeePresenceStatus",
    
    # Finances
    "Finances", "Product", "Supplier",
    
    # Public Website / Page Builder
    "PageLayout", "SiteContent", "SiteRealisation", "VitrineLot", "ContactMessage",
    
    # Visits/Stats
    "Visiteur", "VisiteDuJour", "VisiteEnCours", "ActiviteJournal", "StatsJournalieres",
    
    # Settings/Config
    "AppSettings", "UserProfile",
]