"""
Panacée CRM Backend API Tests
Tests for: Auth, Users, Marathons, Leads, Dashboard, Ranking, Reports, Promises
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from seed data
ADMIN_PRINCIPAL_CODE = "839271"  # Brown Lee Jean
ADMIN_SECONDARY_CODE = "562814"  # Clerveaux Gabriel
VENDEUR_CODE = "1284"  # Peterson


class TestHealthAndRoot:
    """Basic API health checks"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "Panacée CRM API" in data["message"]
        print("✓ API root endpoint working")


class TestAuth:
    """Authentication endpoint tests"""
    
    def test_login_admin_principal_success(self):
        """Test login with admin principal code"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={"code": ADMIN_PRINCIPAL_CODE})
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["name"] == "Brown Lee Jean"
        assert data["user"]["role"] == "admin_principal"
        assert len(data["token"]) > 0
        print("✓ Admin principal login successful")
    
    def test_login_admin_secondary_success(self):
        """Test login with admin secondary code"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={"code": ADMIN_SECONDARY_CODE})
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["name"] == "Clerveaux Gabriel"
        assert data["user"]["role"] == "admin_secondary"
        print("✓ Admin secondary login successful")
    
    def test_login_vendeur_success(self):
        """Test login with vendeur code"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={"code": VENDEUR_CODE})
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["name"] == "Peterson"
        assert data["user"]["role"] == "vendeur"
        print("✓ Vendeur login successful")
    
    def test_login_invalid_code(self):
        """Test login with invalid code"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={"code": "000000"})
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        print("✓ Invalid code rejected correctly")
    
    def test_get_me_authenticated(self):
        """Test /auth/me with valid token"""
        # First login
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={"code": ADMIN_PRINCIPAL_CODE})
        token = login_res.json()["token"]
        
        # Then get me
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert data["user"]["name"] == "Brown Lee Jean"
        print("✓ /auth/me returns correct user")
    
    def test_get_me_unauthenticated(self):
        """Test /auth/me without token"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("✓ /auth/me rejects unauthenticated requests")


class TestUsers:
    """User management tests"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={"code": ADMIN_PRINCIPAL_CODE})
        return response.json()["token"]
    
    @pytest.fixture
    def vendeur_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={"code": VENDEUR_CODE})
        return response.json()["token"]
    
    def test_get_users(self, admin_token):
        """Test getting all users"""
        response = requests.get(f"{BASE_URL}/api/users", headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        assert len(data["users"]) >= 7  # At least 7 seeded users
        print(f"✓ Got {len(data['users'])} users")
    
    def test_get_vendeurs(self, admin_token):
        """Test getting vendeurs only"""
        response = requests.get(f"{BASE_URL}/api/users/vendeurs", headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        data = response.json()
        assert "vendeurs" in data
        assert len(data["vendeurs"]) >= 4  # At least 4 vendeurs
        for v in data["vendeurs"]:
            assert v["role"] == "vendeur"
        print(f"✓ Got {len(data['vendeurs'])} vendeurs")


class TestFormations:
    """Formations endpoint tests"""
    
    def test_get_formations(self):
        """Test getting formations list"""
        response = requests.get(f"{BASE_URL}/api/formations")
        assert response.status_code == 200
        data = response.json()
        assert "formations" in data
        assert "Installation de caméra de surveillance" in data["formations"]
        assert "Électricité" in data["formations"]
        assert "Rolling Door" in data["formations"]
        print("✓ Formations list correct")


class TestMarathons:
    """Marathon CRUD tests"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={"code": ADMIN_PRINCIPAL_CODE})
        return response.json()["token"]
    
    @pytest.fixture
    def vendeur_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={"code": VENDEUR_CODE})
        return response.json()["token"]
    
    def test_get_marathons(self, admin_token):
        """Test getting active marathons"""
        response = requests.get(f"{BASE_URL}/api/marathons", headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        data = response.json()
        assert "marathons" in data
        print(f"✓ Got {len(data['marathons'])} active marathons")
    
    def test_create_marathon(self, admin_token):
        """Test creating a marathon"""
        marathon_data = {
            "name": "TEST_Marathon Test Q1",
            "formation": "Électricité",
            "start_date": "2026-01-01",
            "end_date": "2026-03-31",
            "objectif_total": 50
        }
        response = requests.post(f"{BASE_URL}/api/marathons", json=marathon_data, headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        data = response.json()
        assert "marathon" in data
        assert data["marathon"]["name"] == "TEST_Marathon Test Q1"
        assert data["marathon"]["formation"] == "Électricité"
        assert data["marathon"]["objectif_total"] == 50
        assert data["marathon"]["active"] == True
        print("✓ Marathon created successfully")
        return data["marathon"]["id"]
    
    def test_get_marathon_by_id(self, admin_token):
        """Test getting marathon by ID"""
        # First get list to find an ID
        list_res = requests.get(f"{BASE_URL}/api/marathons", headers={"Authorization": f"Bearer {admin_token}"})
        marathons = list_res.json()["marathons"]
        if len(marathons) > 0:
            marathon_id = marathons[0]["id"]
            response = requests.get(f"{BASE_URL}/api/marathons/{marathon_id}", headers={"Authorization": f"Bearer {admin_token}"})
            assert response.status_code == 200
            data = response.json()
            assert "marathon" in data
            assert data["marathon"]["id"] == marathon_id
            print("✓ Got marathon by ID")
        else:
            pytest.skip("No marathons to test")
    
    def test_vendeur_cannot_create_marathon(self, vendeur_token):
        """Test that vendeur cannot create marathon"""
        marathon_data = {"name": "TEST_Unauthorized", "formation": "Électricité"}
        response = requests.post(f"{BASE_URL}/api/marathons", json=marathon_data, headers={"Authorization": f"Bearer {vendeur_token}"})
        assert response.status_code == 403
        print("✓ Vendeur correctly denied marathon creation")


class TestLeads:
    """Lead CRUD tests"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={"code": ADMIN_PRINCIPAL_CODE})
        return response.json()["token"]
    
    @pytest.fixture
    def vendeur_login(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={"code": VENDEUR_CODE})
        return response.json()
    
    @pytest.fixture
    def marathon_id(self, admin_token):
        """Get or create a marathon for testing"""
        response = requests.get(f"{BASE_URL}/api/marathons", headers={"Authorization": f"Bearer {admin_token}"})
        marathons = response.json()["marathons"]
        if len(marathons) > 0:
            return marathons[0]["id"]
        # Create one if none exists
        marathon_data = {"name": "TEST_Lead Marathon", "formation": "Électricité", "objectif_total": 10}
        create_res = requests.post(f"{BASE_URL}/api/marathons", json=marathon_data, headers={"Authorization": f"Bearer {admin_token}"})
        return create_res.json()["marathon"]["id"]
    
    def test_create_lead(self, admin_token, vendeur_login, marathon_id):
        """Test creating a lead"""
        vendeur_id = vendeur_login["user"]["id"]
        lead_data = {
            "date": "2026-01-15",
            "full_name": "TEST_Jean Pierre",
            "phone": "50912345678",
            "email": "test@example.com",
            "payment_method": "Cash",
            "comments": "Test lead",
            "status": "Très intéressé",
            "address": "Port-au-Prince",
            "profession": "Ingénieur",
            "vendeur_id": vendeur_id,
            "marathon_id": marathon_id,
            "promise_date": "2026-01-20"
        }
        response = requests.post(f"{BASE_URL}/api/leads", json=lead_data, headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        data = response.json()
        assert "lead" in data
        assert data["lead"]["full_name"] == "TEST_Jean Pierre"
        assert data["lead"]["status"] == "Très intéressé"
        print("✓ Lead created successfully")
        return data["lead"]["id"]
    
    def test_get_leads(self, admin_token, marathon_id):
        """Test getting leads for a marathon"""
        response = requests.get(f"{BASE_URL}/api/leads", params={"marathon_id": marathon_id}, headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        data = response.json()
        assert "leads" in data
        print(f"✓ Got {len(data['leads'])} leads")
    
    def test_update_lead(self, admin_token, vendeur_login, marathon_id):
        """Test updating a lead"""
        vendeur_id = vendeur_login["user"]["id"]
        # Create a lead first
        lead_data = {
            "date": "2026-01-15",
            "full_name": "TEST_Update Lead",
            "phone": "50987654321",
            "payment_method": "Carte",
            "status": "Très intéressé",
            "address": "Cap-Haïtien",
            "vendeur_id": vendeur_id,
            "marathon_id": marathon_id
        }
        create_res = requests.post(f"{BASE_URL}/api/leads", json=lead_data, headers={"Authorization": f"Bearer {admin_token}"})
        lead_id = create_res.json()["lead"]["id"]
        
        # Update it
        update_data = {"status": "Inscrit", "comments": "Converted!"}
        response = requests.put(f"{BASE_URL}/api/leads/{lead_id}", json=update_data, headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        data = response.json()
        assert data["lead"]["status"] == "Inscrit"
        assert data["lead"]["comments"] == "Converted!"
        print("✓ Lead updated successfully")


class TestDashboard:
    """Dashboard endpoint tests"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={"code": ADMIN_PRINCIPAL_CODE})
        return response.json()["token"]
    
    @pytest.fixture
    def vendeur_login(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={"code": VENDEUR_CODE})
        return response.json()
    
    @pytest.fixture
    def marathon_id(self, admin_token):
        response = requests.get(f"{BASE_URL}/api/marathons", headers={"Authorization": f"Bearer {admin_token}"})
        marathons = response.json()["marathons"]
        if len(marathons) > 0:
            return marathons[0]["id"]
        pytest.skip("No marathons available")
    
    def test_admin_dashboard(self, admin_token, marathon_id):
        """Test admin dashboard endpoint"""
        response = requests.get(f"{BASE_URL}/api/dashboard/admin", params={"marathon_id": marathon_id}, headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        data = response.json()
        assert "total_leads" in data
        assert "inscrits" in data
        assert "tres_interesses" in data
        assert "taux_conversion" in data
        assert "objectif_total" in data
        assert "progression" in data
        assert "vendeur_stats" in data
        print(f"✓ Admin dashboard: {data['total_leads']} leads, {data['inscrits']} inscrits")
    
    def test_vendeur_dashboard(self, vendeur_login, marathon_id):
        """Test vendeur dashboard endpoint"""
        token = vendeur_login["token"]
        vendeur_id = vendeur_login["user"]["id"]
        response = requests.get(f"{BASE_URL}/api/dashboard/vendeur", params={"marathon_id": marathon_id, "vendeur_id": vendeur_id}, headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        data = response.json()
        assert "total_leads" in data
        assert "inscrits" in data
        assert "tres_interesses" in data
        assert "taux_conversion" in data
        assert "objectif" in data
        assert "progression" in data
        print(f"✓ Vendeur dashboard: {data['total_leads']} leads, {data['inscrits']} inscrits")


class TestRanking:
    """Ranking endpoint tests"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={"code": ADMIN_PRINCIPAL_CODE})
        return response.json()["token"]
    
    @pytest.fixture
    def marathon_id(self, admin_token):
        response = requests.get(f"{BASE_URL}/api/marathons", headers={"Authorization": f"Bearer {admin_token}"})
        marathons = response.json()["marathons"]
        if len(marathons) > 0:
            return marathons[0]["id"]
        pytest.skip("No marathons available")
    
    def test_get_ranking(self, admin_token, marathon_id):
        """Test ranking endpoint"""
        response = requests.get(f"{BASE_URL}/api/ranking", params={"marathon_id": marathon_id}, headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        data = response.json()
        assert "ranking" in data
        # Ranking should be sorted by inscrits descending
        if len(data["ranking"]) > 1:
            for i in range(len(data["ranking"]) - 1):
                assert data["ranking"][i]["inscrits"] >= data["ranking"][i+1]["inscrits"]
        print(f"✓ Got ranking with {len(data['ranking'])} vendeurs")


class TestReports:
    """Reports endpoint tests"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={"code": ADMIN_PRINCIPAL_CODE})
        return response.json()["token"]
    
    @pytest.fixture
    def marathon_id(self, admin_token):
        response = requests.get(f"{BASE_URL}/api/marathons", headers={"Authorization": f"Bearer {admin_token}"})
        marathons = response.json()["marathons"]
        if len(marathons) > 0:
            return marathons[0]["id"]
        pytest.skip("No marathons available")
    
    def test_get_reports(self, admin_token, marathon_id):
        """Test reports endpoint"""
        response = requests.get(f"{BASE_URL}/api/reports", params={"marathon_id": marathon_id}, headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        data = response.json()
        assert "daily" in data
        assert "par_vendeur" in data
        assert "total_leads" in data
        assert "total_inscrits" in data
        assert "total_tres_interesses" in data
        print(f"✓ Reports: {data['total_leads']} leads, {len(data['daily'])} days, {len(data['par_vendeur'])} vendeurs")


class TestPromises:
    """Promises endpoint tests"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={"code": ADMIN_PRINCIPAL_CODE})
        return response.json()["token"]
    
    @pytest.fixture
    def marathon_id(self, admin_token):
        response = requests.get(f"{BASE_URL}/api/marathons", headers={"Authorization": f"Bearer {admin_token}"})
        marathons = response.json()["marathons"]
        if len(marathons) > 0:
            return marathons[0]["id"]
        pytest.skip("No marathons available")
    
    def test_get_today_promises(self, admin_token, marathon_id):
        """Test getting today's promises"""
        response = requests.get(f"{BASE_URL}/api/promises", params={"marathon_id": marathon_id, "filter_type": "today"}, headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        data = response.json()
        assert "promises" in data
        print(f"✓ Got {len(data['promises'])} today promises")
    
    def test_get_overdue_promises(self, admin_token, marathon_id):
        """Test getting overdue promises"""
        response = requests.get(f"{BASE_URL}/api/promises", params={"marathon_id": marathon_id, "filter_type": "overdue"}, headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        data = response.json()
        assert "promises" in data
        print(f"✓ Got {len(data['promises'])} overdue promises")


class TestMarathonTimeRemaining:
    """Marathon time remaining tests"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={"code": ADMIN_PRINCIPAL_CODE})
        return response.json()["token"]
    
    @pytest.fixture
    def marathon_id(self, admin_token):
        response = requests.get(f"{BASE_URL}/api/marathons", headers={"Authorization": f"Bearer {admin_token}"})
        marathons = response.json()["marathons"]
        if len(marathons) > 0:
            return marathons[0]["id"]
        pytest.skip("No marathons available")
    
    def test_time_remaining(self, admin_token, marathon_id):
        """Test marathon time remaining endpoint"""
        response = requests.get(f"{BASE_URL}/api/marathons/{marathon_id}/time-remaining", headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        data = response.json()
        assert "days_remaining" in data
        assert "alert" in data
        print(f"✓ Time remaining: {data['days_remaining']} days")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
