from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog
from app.models.user import User

class AuditService:
    @staticmethod
    def log_action(
        db: Session,
        actor: Optional[User],
        action: str,
        entity: str,
        entity_id: str,
        previous_state: Optional[str] = None,
        new_state: Optional[str] = None,
        metadata_info: Optional[str] = None,
    ) -> AuditLog:
        actor_id = actor.id if actor else None
        actor_name = actor.name if actor else "System"
        actor_role = actor.role.value if actor and hasattr(actor.role, "value") else (actor.role if actor else "SYSTEM")

        log = AuditLog(
            actor_id=actor_id,
            actor_name=actor_name,
            actor_role=actor_role,
            action=action,
            entity=entity,
            entity_id=str(entity_id),
            previous_state=str(previous_state) if previous_state is not None else None,
            new_state=str(new_state) if new_state is not None else None,
            metadata_info=metadata_info,
            timestamp=datetime.now(timezone.utc)
        )
        db.add(log)
        # We don't commit here immediately so it participates in the outer transaction
        return log
