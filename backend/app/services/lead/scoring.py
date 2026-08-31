"""
Lead Scoring Service - Backend implementation mirroring frontend logic
"""
from typing import Dict, Any, Optional
from datetime import datetime
import math

# ============================================
# CONFIGURATION DES POIDS (mirroring frontend)
# ============================================

LEAD_SCORING_WEIGHTS = {
    # Source du lead (max 30 pts)
    'source': {
        'landing_page': 30,
        'referral': 25,
        'web_form': 20,
        'phone_call': 15,
        'walk_in': 15,
        'social_media': 15,
        'email_campaign': 10,
        'direct': 10,
        'unknown': 5,
    },
    
    # Engagement par canal (max 20 pts)
    'channelEngagement': {
        'whatsapp': 15,
        'email': 10,
        'sms': 8,
        'telegram': 5,
        'call': 20,
        'meeting': 25,
    },
    
    # Récence dernière interaction (max 20 pts)
    'recency': lambda hours: (
        20 if hours <= 1 else
        18 if hours <= 4 else
        15 if hours <= 12 else
        12 if hours <= 24 else
        10 if hours <= 48 else
        8 if hours <= 72 else
        5 if hours <= 168 else  # 7 jours
        2 if hours <= 720 else  # 30 jours
        0
    ),
    
    # Fréquence interactions (max 15 pts)
    'frequency': lambda count: (
        15 if count >= 10 else
        12 if count >= 5 else
        10 if count >= 3 else
        7 if count >= 2 else
        4 if count >= 1 else
        0
    ),
    
    # Complétude profil (max 10 pts)
    'profileCompleteness': lambda lead_data: min((
        (2 if lead_data.get('first_name') else 0) +
        (2 if lead_data.get('last_name') else 0) +
        (2 if lead_data.get('email') else 0) +
        (1 if lead_data.get('channels_optin', {}).get('whatsapp') else 0) +
        (1 if lead_data.get('channels_optin', {}).get('email') else 0) +
        (1 if lead_data.get('channels_optin', {}).get('sms') else 0) +
        (1 if lead_data.get('channels_optin', {}).get('telegram') else 0)
    ), 10),
    
    # Profondeur navigation (max 5 pts)
    'pageDepth': lambda views: (
        5 if views >= 10 else
        4 if views >= 5 else
        3 if views >= 3 else
        2 if views >= 2 else
        1 if views >= 1 else
        0
    )
}

def calculate_lead_score_with_breakdown(lead_data: Dict[str, Any],
    context: Dict[str, Any] | None = None
) -> Dict[str, Any]:
    """Calculates the lead score with breakdown (0-100)

    Args:
        lead_data: Dictionary containing lead information from entity.metadata
        context: Dictionary with optional context:
            - interaction_count: Number of interactions
            - hours_since_last_interaction: Hours since last interaction
            - page_views: Number of page views
            - last_channel_used: Last channel used for interaction

    Returns:
        Score between 0 and 100
    """
    context = context or {}
    
    # Extract context values with defaults
    interaction_count = context.get('interaction_count', 0)
    hours_since_last_interaction = context.get('hours_since_last_interaction', 9999)
    page_views = context.get('page_views', 1)
    last_channel_used = context.get('last_channel_used', '')
    
    # 1. Source score
    source = lead_data.get('source', 'unknown')
    source_score = LEAD_SCORING_WEIGHTS['source'].get(source, LEAD_SCORING_WEIGHTS['source']['unknown'])
    
    # 2. Channel engagement score
    channel_engagement_score = 0
    if last_channel_used:
        channel_engagement_score = LEAD_SCORING_WEIGHTS['channelEngagement'].get(last_channel_used, 0)
    else:
        # Use the highest scoring opted-in channel
        channels_optin = lead_data.get('channels_optin', {})
        if channels_optin:
            scores = [
                LEAD_SCORING_WEIGHTS['channelEngagement'].get(channel, 0)
                for channel, opted_in in channels_optin.items()
                if opted_in
            ]
            channel_engagement_score = max(scores) if scores else 0
    
    # 3. Recency score
    recency_score = LEAD_SCORING_WEIGHTS['recency'](hours_since_last_interaction)
    
    # 4. Frequency score
    frequency_score = LEAD_SCORING_WEIGHTS['frequency'](interaction_count)
    
    # 5. Profile completeness score
    profile_score = LEAD_SCORING_WEIGHTS['profileCompleteness'](lead_data)
    
    # 6. Page depth score
    page_depth_score = LEAD_SCORING_WEIGHTS['pageDepth'](page_views)
    
    # Calculate total
    total = (
        source_score +
        channel_engagement_score +
        recency_score +
        frequency_score +
        profile_score +
        page_depth_score
    )
    
    return min(round(total), 100)

def calculate_lead_score_with_breakdown(
    lead_data: Dict[str, Any],
    context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Calculate lead score with detailed breakdown
    
    Returns:
        Dictionary with score and breakdown details
    """
    context = context or {}
    
    # Extract context values with defaults
    interaction_count = context.get('interaction_count', 0)
    hours_since_last_interaction = context.get('hours_since_last_interaction', 9999)
    page_views = context.get('page_views', 1)
    last_channel_used = context.get('last_channel_used', '')
    
    # 1. Source score
    source = lead_data.get('source', 'unknown')
    source_score = LEAD_SCORING_WEIGHTS['source'].get(source, LEAD_SCORING_WEIGHTS['source']['unknown'])
    
    # 2. Channel engagement score
    channel_engagement_score = 0
    if last_channel_used:
        channel_engagement_score = LEAD_SCORING_WEIGHTS['channelEngagement'].get(last_channel_used, 0)
    else:
        channels_optin = lead_data.get('channels_optin', {})
        if channels_optin:
            scores = [
                LEAD_SCORING_WEIGHTS['channelEngagement'].get(channel, 0)
                for channel, opted_in in channels_optin.items()
                if opted_in
            ]
            channel_engagement_score = max(scores) if scores else 0
    
    # 3. Recency score
    recency_score = LEAD_SCORING_WEIGHTS['recency'](hours_since_last_interaction)
    
    # 4. Frequency score
    frequency_score = LEAD_SCORING_WEIGHTS['frequency'](interaction_count)
    
    # 5. Profile completeness score
    profile_score = LEAD_SCORING_WEIGHTS['profileCompleteness'](lead_data)
    
    # 6. Page depth score
    page_depth_score = LEAD_SCORING_WEIGHTS['pageDepth'](page_views)
    
    # Calculate total
    total = (
        source_score +
        channel_engagement_score +
        recency_score +
        frequency_score +
        profile_score +
        page_depth_score
    )
    total = min(round(total), 100)
    
    # Determine tier
    if total >= 70:
        tier = 'hot'
    elif total >= 40:
        tier = 'warm'
    elif hours_since_last_interaction > 720 and interaction_count == 0:
        tier = 'churned'
    else:
        tier = 'cold'
    
    # Generate factors
    factors = []
    if source_score >= 20:
        factors.append(f"Source qualifiée ({source_score}pts)")
    if channel_engagement_score >= 10:
        factors.append(f"Canal engagé ({channel_engagement_score}pts)")
    if recency_score >= 15:
        factors.append(f"Interaction récente ({recency_score}pts)")
    if frequency_score >= 10:
        factors.append(f"Interactions fréquentes ({frequency_score}pts)")
    if profile_score >= 7:
        factors.append(f"Profil complet ({profile_score}pts)")
    if page_depth_score >= 3:
        factors.append(f"Navigation approfondie ({page_depth_score}pts)")
    if tier == 'churned':
        factors.append("⚠️ Lead inactif 30j+")
    
    return {
        'total': total,
        'source': source_score,
        'channelEngagement': channel_engagement_score,
        'recency': recency_score,
        'frequency': frequency_score,
        'profileCompleteness': profile_score,
        'pageDepth': page_depth_score,
        'tier': tier,
        'factors': factors
    }

def get_hours_since_last_interaction(last_interaction_at: Optional[str]) -> int:
    """
    Calculate hours since last interaction
    
    Args:
        last_interaction_at: ISO format datetime string or None
        
    Returns:
        Hours as integer (9999 if None)
    """
    if not last_interaction_at:
        return 9999
    try:
        if isinstance(last_interaction_at, str):
            last_interaction = datetime.fromisoformat(last_interaction_at.replace('Z', '+00:00'))
        else:
            # Assume it's already a datetime object
            last_interaction = last_interaction_at
        delta = datetime.now() - last_interaction
        return int(delta.total_seconds() / 3600)
    except Exception:
        return 9999

def get_tier_config(tier: str) -> Dict[str, Any]:
    """Get tier configuration for display"""
    configs = {
        'hot': {'label': '🔥 Chaud', 'color': 'bg-red-100 text-red-700', 'emoji': '🔥'},
        'warm': {'label': '🌡️ Tiède', 'color': 'bg-orange-100 text-orange-700', 'emoji': '🌡️'},
        'cold': {'label': '❄️ Froid', 'color': 'bg-blue-100 text-blue-700', 'emoji': '❄️'},
        'churned': {'label': '💀 Perdu', 'color': 'bg-gray-100 text-gray-600', 'emoji': '💀'}
    }
    return configs.get(tier, configs['cold'])

def sort_leads_by_score(leads: list, context_func=None) -> list:
    """
    Sort leads by score descending
    
    Args:
        leads: List of lead dictionaries
        context_func: Function that takes a lead and returns context dict
        
    Returns:
        Sorted list:        )
</wecontext_func:
        Storted list of: leads
    """
    if context_func is None:
        context_func = lambda lead: {}
    
    def get_score(lead):
        metadata = lead.get('entity_metadata', {})
        context = context_func(lead)
        result = calculate_lead_score_with_breakdown(metadata, context)
        return result['total']
    
    return sorted(leads, key=get_score, reverse=True)

def filter_leads_by_tier(leads: list, tier: str, context_func=None) -> list:
    """
    Filter leads by tier
    
    Args:
        leads: List of lead dictionaries
        tier: Tier to filter by ('hot', 'warm', 'cold', 'churned')
        context_func: Function that takes a lead and returns context dict
        
    Returns:
        Filtered list of leads
    """
    if context_func is None:
        context_func = lambda lead: {}
    
    def matches_tier(lead):
        metadata = lead.get('entity_metadata', {})
        context = context_func(lead)
        result = calculate_lead_score_with_breakdown(metadata, context)
        return result['tier'] == tier
    
    return list(filter(matches_tier, leads))

