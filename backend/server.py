from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import jwt
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone, timedelta
import uuid

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ─── USERS SEED DATA ───
SEED_USERS = [
    {"id": str(uuid.uuid4()), "name": "Brown Lee Jean", "code": "839271", "role": "admin_principal"},
    {"id": str(uuid.uuid4()), "name": "Clerveaux Gabriel", "code": "562814", "role": "admin_secondary"},
    {"id": str(uuid.uuid4()), "name": "Ermain Innocent", "code": "947305", "role": "admin_secondary"},
    {"id": str(uuid.uuid4()), "name": "Peterson", "code": "1284", "role": "vendeur"},
    {"id": str(uuid.uuid4()), "name": "Maëva", "code": "7391", "role": "vendeur"},
    {"id": str(uuid.uuid4()), "name": "Laguerre", "code": "5602", "role": "vendeur"},
    {"id": str(uuid.uuid4()), "name": "Edjivenson", "code": "8947", "role": "vendeur"},
]

FORMATIONS = [
    "Installation de caméra de surveillance",
    "Électricité",
    "Rolling Door"
]

# ─── PYDANTIC MODELS ───
class UserOut(BaseModel):
    id: str
    name: str
    code: str
    role: str

class LoginRequest(BaseModel):
    code: str

class MarathonCreate(BaseModel):
    name: str
    formation: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    objectif_total: int = 0
    objectif_par_vendeur: Optional[dict] = None

class MarathonUpdate(BaseModel):
    name: Optional[str] = None
    formation: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    objectif_total: Optional[int] = None
    objectif_par_vendeur: Optional[dict] = None

class LeadCreate(BaseModel):
    date: str
    full_name: str
    phone: str
    email: Optional[str] = ""
    payment_method: str
    comments: Optional[str] = ""
    status: str
    address: str
    profession: Optional[str] = ""
    vendeur_id: str
    marathon_id: str
    promise_date: Optional[str] = None

class LeadUpdate(BaseModel):
    date: Optional[str] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    payment_method: Optional[str] = None
    comments: Optional[str] = None
    status: Optional[str] = None
    address: Optional[str] = None
    profession: Optional[str] = None
    promise_date: Optional[str] = None

class DeletionRequest(BaseModel):
    lead_id: str
    vendeur_id: str
    reason: Optional[str] = ""

# ─── AUTH HELPERS ───
def create_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "access"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = request.headers.get("Authorization", "")
    if token.startswith("Bearer "):
        token = token[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Non authentifié")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="Utilisateur non trouvé")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expiré")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalide")

def require_admin(user: dict):
    if user["role"] not in ["admin_principal", "admin_secondary"]:
        raise HTTPException(status_code=403, detail="Accès refusé")

def require_admin_principal(user: dict):
    if user["role"] != "admin_principal":
        raise HTTPException(status_code=403, detail="Accès réservé à l'administrateur principal")

# ─── SEED ON STARTUP ───
@app.on_event("startup")
async def seed_data():
    for u in SEED_USERS:
        existing = await db.users.find_one({"code": u["code"]}, {"_id": 0})
        if not existing:
            await db.users.insert_one(u)
            logger.info(f"Seeded user: {u['name']}")
    await db.users.create_index("code", unique=True)
    await db.users.create_index("id", unique=True)
    await db.marathons.create_index("id", unique=True)
    await db.leads.create_index("id", unique=True)
    logger.info("Database seeded and indexes created")

    # Write test credentials
    creds_dir = Path("/app/memory")
    creds_dir.mkdir(exist_ok=True)
    with open(creds_dir / "test_credentials.md", "w") as f:
        f.write("# Test Credentials\n\n")
        f.write("## Auth (code-based login)\n")
        for u in SEED_USERS:
            f.write(f"- **{u['name']}** ({u['role']}): code `{u['code']}`\n")
        f.write("\n## Endpoints\n")
        f.write("- POST /api/auth/login\n")
        f.write("- GET /api/auth/me\n")

# ─── AUTH ROUTES ───
@api_router.post("/auth/login")
async def login(req: LoginRequest):
    user = await db.users.find_one({"code": req.code}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Code invalide")
    token = create_token(user["id"], user["role"])
    return {"token": token, "user": user}

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {"user": user}

# ─── USERS ROUTES ───
@api_router.get("/users")
async def get_users(user: dict = Depends(get_current_user)):
    users = await db.users.find({}, {"_id": 0}).to_list(100)
    return {"users": users}

@api_router.get("/users/vendeurs")
async def get_vendeurs(user: dict = Depends(get_current_user)):
    vendeurs = await db.users.find({"role": "vendeur"}, {"_id": 0}).to_list(100)
    return {"vendeurs": vendeurs}

@api_router.post("/users")
async def create_user(name: str = "", code: str = "", role: str = "vendeur", user: dict = Depends(get_current_user)):
    require_admin_principal(user)
    existing = await db.users.find_one({"code": code}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Code déjà utilisé")
    new_user = {"id": str(uuid.uuid4()), "name": name, "code": code, "role": role}
    await db.users.insert_one(new_user)
    return {"user": {k: v for k, v in new_user.items() if k != "_id"}}

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, user: dict = Depends(get_current_user)):
    require_admin_principal(user)
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return {"message": "Utilisateur supprimé"}

# ─── FORMATIONS ROUTE ───
@api_router.get("/formations")
async def get_formations():
    return {"formations": FORMATIONS}

# ─── MARATHON ROUTES ───
@api_router.post("/marathons")
async def create_marathon(data: MarathonCreate, user: dict = Depends(get_current_user)):
    require_admin_principal(user)
    marathon = {
        "id": str(uuid.uuid4()),
        "name": data.name,
        "formation": data.formation,
        "start_date": data.start_date,
        "end_date": data.end_date,
        "objectif_total": data.objectif_total,
        "objectif_par_vendeur": data.objectif_par_vendeur or {},
        "created_at": datetime.now(timezone.utc).isoformat(),
        "active": True
    }
    await db.marathons.insert_one(marathon)
    marathon.pop("_id", None)
    return {"marathon": marathon}

@api_router.get("/marathons")
async def get_marathons(user: dict = Depends(get_current_user)):
    marathons = await db.marathons.find({"active": True}, {"_id": 0}).to_list(100)
    return {"marathons": marathons}

@api_router.get("/marathons/all")
async def get_all_marathons(user: dict = Depends(get_current_user)):
    require_admin(user)
    marathons = await db.marathons.find({}, {"_id": 0}).to_list(100)
    return {"marathons": marathons}

@api_router.get("/marathons/{marathon_id}")
async def get_marathon(marathon_id: str, user: dict = Depends(get_current_user)):
    marathon = await db.marathons.find_one({"id": marathon_id}, {"_id": 0})
    if not marathon:
        raise HTTPException(status_code=404, detail="Marathon non trouvée")
    return {"marathon": marathon}

@api_router.put("/marathons/{marathon_id}")
async def update_marathon(marathon_id: str, data: MarathonUpdate, user: dict = Depends(get_current_user)):
    require_admin(user)
    update = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update:
        raise HTTPException(status_code=400, detail="Aucune donnée à mettre à jour")
    await db.marathons.update_one({"id": marathon_id}, {"$set": update})
    marathon = await db.marathons.find_one({"id": marathon_id}, {"_id": 0})
    return {"marathon": marathon}

@api_router.delete("/marathons/{marathon_id}")
async def delete_marathon(marathon_id: str, user: dict = Depends(get_current_user)):
    require_admin_principal(user)
    await db.marathons.update_one({"id": marathon_id}, {"$set": {"active": False}})
    return {"message": "Marathon désactivée"}

# ─── LEADS ROUTES ───
@api_router.post("/leads")
async def create_lead(data: LeadCreate, user: dict = Depends(get_current_user)):
    marathon = await db.marathons.find_one({"id": data.marathon_id}, {"_id": 0})
    if not marathon:
        raise HTTPException(status_code=404, detail="Marathon non trouvée")
    lead = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "formation": marathon["formation"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": user["id"]
    }
    await db.leads.insert_one(lead)
    lead.pop("_id", None)
    return {"lead": lead}

@api_router.get("/leads")
async def get_leads(
    marathon_id: str,
    vendeur_id: Optional[str] = None,
    status: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    query = {"marathon_id": marathon_id}
    if vendeur_id:
        query["vendeur_id"] = vendeur_id
    if status:
        query["status"] = status
    leads = await db.leads.find(query, {"_id": 0}).sort("date", -1).to_list(5000)
    return {"leads": leads}

@api_router.get("/leads/{lead_id}")
async def get_lead(lead_id: str, user: dict = Depends(get_current_user)):
    lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead non trouvé")
    return {"lead": lead}

@api_router.put("/leads/{lead_id}")
async def update_lead(lead_id: str, data: LeadUpdate, user: dict = Depends(get_current_user)):
    update = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update:
        raise HTTPException(status_code=400, detail="Aucune donnée")
    await db.leads.update_one({"id": lead_id}, {"$set": update})
    lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    return {"lead": lead}

@api_router.delete("/leads/{lead_id}")
async def delete_lead(lead_id: str, user: dict = Depends(get_current_user)):
    if user["role"] == "admin_principal":
        await db.leads.delete_one({"id": lead_id})
        return {"message": "Lead supprimé"}
    elif user["role"] in ["vendeur", "admin_secondary"]:
        req = {
            "id": str(uuid.uuid4()),
            "lead_id": lead_id,
            "vendeur_id": user["id"],
            "vendeur_name": user["name"],
            "reason": "",
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.deletion_requests.insert_one(req)
        req.pop("_id", None)
        return {"message": "Demande de suppression envoyée", "request": req}
    else:
        raise HTTPException(status_code=403, detail="Accès refusé")

# ─── DELETION REQUESTS ───
@api_router.get("/deletion-requests")
async def get_deletion_requests(user: dict = Depends(get_current_user)):
    require_admin(user)
    reqs = await db.deletion_requests.find({"status": "pending"}, {"_id": 0}).to_list(100)
    return {"requests": reqs}

@api_router.post("/deletion-requests/{req_id}/approve")
async def approve_deletion(req_id: str, user: dict = Depends(get_current_user)):
    require_admin_principal(user)
    req = await db.deletion_requests.find_one({"id": req_id}, {"_id": 0})
    if not req:
        raise HTTPException(status_code=404, detail="Demande non trouvée")
    await db.leads.delete_one({"id": req["lead_id"]})
    await db.deletion_requests.update_one({"id": req_id}, {"$set": {"status": "approved"}})
    return {"message": "Suppression approuvée"}

@api_router.post("/deletion-requests/{req_id}/reject")
async def reject_deletion(req_id: str, user: dict = Depends(get_current_user)):
    require_admin_principal(user)
    await db.deletion_requests.update_one({"id": req_id}, {"$set": {"status": "rejected"}})
    return {"message": "Suppression rejetée"}

# ─── PROMISES ROUTES ───
@api_router.get("/promises")
async def get_promises(
    marathon_id: str,
    vendeur_id: Optional[str] = None,
    filter_type: Optional[str] = "today",
    user: dict = Depends(get_current_user)
):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    query = {"marathon_id": marathon_id, "status": "Très intéressé", "promise_date": {"$nin": [None, ""]}}

    if vendeur_id:
        query["vendeur_id"] = vendeur_id

    if filter_type == "today":
        query["promise_date"] = today
    elif filter_type == "overdue":
        query["promise_date"] = {"$lt": today, "$nin": [None, ""]}
    elif filter_type == "all":
        query["promise_date"] = {"$nin": [None, ""]}

    leads = await db.leads.find(query, {"_id": 0}).sort("promise_date", 1).to_list(5000)
    return {"promises": leads}

# ─── DASHBOARD ROUTES ───
@api_router.get("/dashboard/vendeur")
async def dashboard_vendeur(
    marathon_id: str,
    vendeur_id: str,
    user: dict = Depends(get_current_user)
):
    total_leads = await db.leads.count_documents({"marathon_id": marathon_id, "vendeur_id": vendeur_id})
    inscrits = await db.leads.count_documents({"marathon_id": marathon_id, "vendeur_id": vendeur_id, "status": "Inscrit"})
    tres_interesses = await db.leads.count_documents({"marathon_id": marathon_id, "vendeur_id": vendeur_id, "status": "Très intéressé"})

    marathon = await db.marathons.find_one({"id": marathon_id}, {"_id": 0})
    objectif = 0
    if marathon and marathon.get("objectif_par_vendeur"):
        objectif = marathon["objectif_par_vendeur"].get(vendeur_id, 0)

    taux_conversion = round((inscrits / total_leads * 100), 1) if total_leads > 0 else 0
    progression = round((inscrits / objectif * 100), 1) if objectif > 0 else 0

    return {
        "total_leads": total_leads,
        "inscrits": inscrits,
        "tres_interesses": tres_interesses,
        "taux_conversion": taux_conversion,
        "objectif": objectif,
        "progression": min(progression, 100)
    }

@api_router.get("/dashboard/admin")
async def dashboard_admin(
    marathon_id: str,
    vendeur_id: Optional[str] = None,
    formation: Optional[str] = None,
    period: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    query = {"marathon_id": marathon_id}
    if vendeur_id:
        query["vendeur_id"] = vendeur_id
    if formation:
        query["formation"] = formation

    if period:
        now = datetime.now(timezone.utc)
        if period == "7":
            cutoff = (now - timedelta(days=7)).strftime("%Y-%m-%d")
        elif period == "15":
            cutoff = (now - timedelta(days=15)).strftime("%Y-%m-%d")
        elif period == "30":
            cutoff = (now - timedelta(days=30)).strftime("%Y-%m-%d")
        else:
            cutoff = None
        if cutoff:
            query["date"] = {"$gte": cutoff}

    if start_date and end_date:
        query["date"] = {"$gte": start_date, "$lte": end_date}

    total_leads = await db.leads.count_documents(query)
    inscrits = await db.leads.count_documents({**query, "status": "Inscrit"})
    tres_interesses = await db.leads.count_documents({**query, "status": "Très intéressé"})

    marathon = await db.marathons.find_one({"id": marathon_id}, {"_id": 0})
    objectif_total = marathon["objectif_total"] if marathon else 0
    taux_conversion = round((inscrits / total_leads * 100), 1) if total_leads > 0 else 0
    progression = round((inscrits / objectif_total * 100), 1) if objectif_total > 0 else 0

    # Per vendeur stats
    vendeurs = await db.users.find({"role": "vendeur"}, {"_id": 0}).to_list(50)
    vendeur_stats = []
    for v in vendeurs:
        v_query = {**query, "vendeur_id": v["id"]}
        v_total = await db.leads.count_documents(v_query)
        v_inscrits = await db.leads.count_documents({**v_query, "status": "Inscrit"})
        v_objectif = marathon.get("objectif_par_vendeur", {}).get(v["id"], 0) if marathon else 0
        vendeur_stats.append({
            "vendeur_id": v["id"],
            "vendeur_name": v["name"],
            "total_leads": v_total,
            "inscrits": v_inscrits,
            "objectif": v_objectif,
            "taux_conversion": round((v_inscrits / v_total * 100), 1) if v_total > 0 else 0
        })

    return {
        "total_leads": total_leads,
        "inscrits": inscrits,
        "tres_interesses": tres_interesses,
        "taux_conversion": taux_conversion,
        "objectif_total": objectif_total,
        "progression": min(progression, 100),
        "vendeur_stats": vendeur_stats
    }

# ─── RANKING ───
@api_router.get("/ranking")
async def get_ranking(marathon_id: str, user: dict = Depends(get_current_user)):
    vendeurs = await db.users.find({"role": "vendeur"}, {"_id": 0}).to_list(50)
    ranking = []
    for v in vendeurs:
        inscrits = await db.leads.count_documents({"marathon_id": marathon_id, "vendeur_id": v["id"], "status": "Inscrit"})
        total = await db.leads.count_documents({"marathon_id": marathon_id, "vendeur_id": v["id"]})
        ranking.append({
            "vendeur_id": v["id"],
            "vendeur_name": v["name"],
            "inscrits": inscrits,
            "total_leads": total,
            "taux_conversion": round((inscrits / total * 100), 1) if total > 0 else 0
        })
    ranking.sort(key=lambda x: x["inscrits"], reverse=True)
    return {"ranking": ranking}

# ─── REPORTS ───
@api_router.get("/reports")
async def get_reports(
    marathon_id: str,
    vendeur_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    query = {"marathon_id": marathon_id}
    if vendeur_id:
        query["vendeur_id"] = vendeur_id
    if start_date and end_date:
        query["date"] = {"$gte": start_date, "$lte": end_date}

    leads = await db.leads.find(query, {"_id": 0}).sort("date", 1).to_list(10000)

    # Group by date
    daily = {}
    for lead in leads:
        d = lead.get("date", "unknown")
        if d not in daily:
            daily[d] = {"date": d, "total": 0, "inscrits": 0, "tres_interesses": 0}
        daily[d]["total"] += 1
        if lead.get("status") == "Inscrit":
            daily[d]["inscrits"] += 1
        elif lead.get("status") == "Très intéressé":
            daily[d]["tres_interesses"] += 1

    # Per vendeur
    vendeur_report = {}
    vendeurs = await db.users.find({"role": "vendeur"}, {"_id": 0}).to_list(50)
    vendeur_map = {v["id"]: v["name"] for v in vendeurs}
    for lead in leads:
        vid = lead.get("vendeur_id")
        if vid not in vendeur_report:
            vendeur_report[vid] = {"vendeur_id": vid, "vendeur_name": vendeur_map.get(vid, "Inconnu"), "total": 0, "inscrits": 0, "tres_interesses": 0}
        vendeur_report[vid]["total"] += 1
        if lead.get("status") == "Inscrit":
            vendeur_report[vid]["inscrits"] += 1
        elif lead.get("status") == "Très intéressé":
            vendeur_report[vid]["tres_interesses"] += 1

    return {
        "daily": sorted(daily.values(), key=lambda x: x["date"]),
        "par_vendeur": list(vendeur_report.values()),
        "total_leads": len(leads),
        "total_inscrits": sum(1 for l in leads if l.get("status") == "Inscrit"),
        "total_tres_interesses": sum(1 for l in leads if l.get("status") == "Très intéressé")
    }

# ─── MARATHON TIME REMAINING ───
@api_router.get("/marathons/{marathon_id}/time-remaining")
async def marathon_time_remaining(marathon_id: str, user: dict = Depends(get_current_user)):
    marathon = await db.marathons.find_one({"id": marathon_id}, {"_id": 0})
    if not marathon or not marathon.get("end_date"):
        return {"days_remaining": None, "alert": None}

    end = datetime.strptime(marathon["end_date"], "%Y-%m-%d").date()
    today = datetime.now(timezone.utc).date()

    if end <= today:
        return {"days_remaining": 0, "alert": "Marathon terminée"}

    # Count business days (exclude Sundays)
    days = 0
    current = today
    while current < end:
        current += timedelta(days=1)
        if current.weekday() != 6:  # 6 = Sunday
            days += 1

    alert = None
    if days <= 3:
        alert = "Marathon proche de la fin"
    elif days <= 7:
        alert = "Moins d'une semaine restante"

    return {"days_remaining": days, "alert": alert}

# ─── ROOT ───
@api_router.get("/")
async def root():
    return {"message": "Panacée CRM API"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
