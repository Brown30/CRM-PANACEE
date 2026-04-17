"""
Test suite for Panacée CRM NEW FEATURES (Iteration 2):
- PUT /api/users/{user_id}/code - Admin principal can modify user codes
- Code validation: vendeur=4 digits, admin=6 digits
- Code duplicate check
- Time remaining endpoint returns time_percentage
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestCodeModification:
    """Tests for PUT /api/users/{user_id}/code endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as admin principal to get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={"code": "839271"})
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        self.admin_token = data["token"]
        self.admin_headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Get all users to find vendeur and admin IDs
        users_response = requests.get(f"{BASE_URL}/api/users", headers=self.admin_headers)
        assert users_response.status_code == 200
        self.users = users_response.json()["users"]
        
        # Find a vendeur (Peterson - code 1284)
        self.vendeur = next((u for u in self.users if u["role"] == "vendeur"), None)
        # Find an admin_secondary
        self.admin_secondary = next((u for u in self.users if u["role"] == "admin_secondary"), None)
        
    def test_update_vendeur_code_valid_4_digits(self):
        """Vendeur code must be exactly 4 digits - valid case"""
        if not self.vendeur:
            pytest.skip("No vendeur found")
        
        # Store original code to restore later
        original_code = self.vendeur["code"]
        new_code = "9999"
        
        response = requests.put(
            f"{BASE_URL}/api/users/{self.vendeur['id']}/code",
            json={"code": new_code},
            headers=self.admin_headers
        )
        
        assert response.status_code == 200, f"Failed to update vendeur code: {response.text}"
        data = response.json()
        assert data["user"]["code"] == new_code
        
        # Restore original code
        requests.put(
            f"{BASE_URL}/api/users/{self.vendeur['id']}/code",
            json={"code": original_code},
            headers=self.admin_headers
        )
    
    def test_update_vendeur_code_invalid_3_digits(self):
        """Vendeur code with 3 digits should fail"""
        if not self.vendeur:
            pytest.skip("No vendeur found")
        
        response = requests.put(
            f"{BASE_URL}/api/users/{self.vendeur['id']}/code",
            json={"code": "123"},
            headers=self.admin_headers
        )
        
        assert response.status_code == 400
        assert "4 chiffres" in response.json()["detail"]
    
    def test_update_vendeur_code_invalid_5_digits(self):
        """Vendeur code with 5 digits should fail"""
        if not self.vendeur:
            pytest.skip("No vendeur found")
        
        response = requests.put(
            f"{BASE_URL}/api/users/{self.vendeur['id']}/code",
            json={"code": "12345"},
            headers=self.admin_headers
        )
        
        assert response.status_code == 400
        assert "4 chiffres" in response.json()["detail"]
    
    def test_update_vendeur_code_invalid_non_numeric(self):
        """Vendeur code with non-numeric characters should fail"""
        if not self.vendeur:
            pytest.skip("No vendeur found")
        
        response = requests.put(
            f"{BASE_URL}/api/users/{self.vendeur['id']}/code",
            json={"code": "12ab"},
            headers=self.admin_headers
        )
        
        assert response.status_code == 400
        assert "4 chiffres" in response.json()["detail"]
    
    def test_update_admin_code_valid_6_digits(self):
        """Admin code must be exactly 6 digits - valid case"""
        if not self.admin_secondary:
            pytest.skip("No admin_secondary found")
        
        original_code = self.admin_secondary["code"]
        new_code = "999999"
        
        response = requests.put(
            f"{BASE_URL}/api/users/{self.admin_secondary['id']}/code",
            json={"code": new_code},
            headers=self.admin_headers
        )
        
        assert response.status_code == 200, f"Failed to update admin code: {response.text}"
        data = response.json()
        assert data["user"]["code"] == new_code
        
        # Restore original code
        requests.put(
            f"{BASE_URL}/api/users/{self.admin_secondary['id']}/code",
            json={"code": original_code},
            headers=self.admin_headers
        )
    
    def test_update_admin_code_invalid_4_digits(self):
        """Admin code with 4 digits should fail"""
        if not self.admin_secondary:
            pytest.skip("No admin_secondary found")
        
        response = requests.put(
            f"{BASE_URL}/api/users/{self.admin_secondary['id']}/code",
            json={"code": "1234"},
            headers=self.admin_headers
        )
        
        assert response.status_code == 400
        assert "6 chiffres" in response.json()["detail"]
    
    def test_update_admin_code_invalid_7_digits(self):
        """Admin code with 7 digits should fail"""
        if not self.admin_secondary:
            pytest.skip("No admin_secondary found")
        
        response = requests.put(
            f"{BASE_URL}/api/users/{self.admin_secondary['id']}/code",
            json={"code": "1234567"},
            headers=self.admin_headers
        )
        
        assert response.status_code == 400
        assert "6 chiffres" in response.json()["detail"]
    
    def test_duplicate_code_rejected(self):
        """Using an existing code should be rejected"""
        if not self.vendeur:
            pytest.skip("No vendeur found")
        
        # Try to use another user's code
        other_user = next((u for u in self.users if u["id"] != self.vendeur["id"] and u["role"] == "vendeur"), None)
        if not other_user:
            pytest.skip("No other vendeur found")
        
        response = requests.put(
            f"{BASE_URL}/api/users/{self.vendeur['id']}/code",
            json={"code": other_user["code"]},
            headers=self.admin_headers
        )
        
        assert response.status_code == 400
        assert "déjà utilisé" in response.json()["detail"]
    
    def test_non_admin_principal_cannot_update_code(self):
        """Only admin_principal can update codes"""
        # Login as vendeur
        vendeur_login = requests.post(f"{BASE_URL}/api/auth/login", json={"code": "1284"})
        assert vendeur_login.status_code == 200
        vendeur_token = vendeur_login.json()["token"]
        vendeur_headers = {"Authorization": f"Bearer {vendeur_token}"}
        
        # Try to update a code
        response = requests.put(
            f"{BASE_URL}/api/users/{self.vendeur['id']}/code",
            json={"code": "9999"},
            headers=vendeur_headers
        )
        
        assert response.status_code == 403
    
    def test_update_nonexistent_user_code(self):
        """Updating code for non-existent user should return 404"""
        response = requests.put(
            f"{BASE_URL}/api/users/nonexistent-id/code",
            json={"code": "1234"},
            headers=self.admin_headers
        )
        
        assert response.status_code == 404


class TestTimeRemainingPercentage:
    """Tests for time_percentage in marathon time-remaining endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get marathon"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={"code": "839271"})
        assert response.status_code == 200
        data = response.json()
        self.token = data["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        # Get active marathons
        marathons_response = requests.get(f"{BASE_URL}/api/marathons", headers=self.headers)
        assert marathons_response.status_code == 200
        self.marathons = marathons_response.json()["marathons"]
    
    def test_time_remaining_returns_time_percentage(self):
        """Time remaining endpoint should return time_percentage field"""
        if not self.marathons:
            pytest.skip("No marathons found")
        
        marathon = self.marathons[0]
        response = requests.get(
            f"{BASE_URL}/api/marathons/{marathon['id']}/time-remaining",
            headers=self.headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify time_percentage field exists
        assert "time_percentage" in data, "time_percentage field missing from response"
        assert isinstance(data["time_percentage"], (int, float)), "time_percentage should be a number"
        assert 0 <= data["time_percentage"] <= 100, f"time_percentage should be 0-100, got {data['time_percentage']}"
        
        print(f"Marathon: {marathon['name']}")
        print(f"Days remaining: {data.get('days_remaining')}")
        print(f"Time percentage: {data['time_percentage']}%")


class TestDashboardCustomPeriod:
    """Tests for custom period filter on dashboard endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get marathon"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={"code": "839271"})
        assert response.status_code == 200
        data = response.json()
        self.token = data["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        # Get active marathons
        marathons_response = requests.get(f"{BASE_URL}/api/marathons", headers=self.headers)
        assert marathons_response.status_code == 200
        self.marathons = marathons_response.json()["marathons"]
        
        # Get vendeurs
        vendeurs_response = requests.get(f"{BASE_URL}/api/users/vendeurs", headers=self.headers)
        assert vendeurs_response.status_code == 200
        self.vendeurs = vendeurs_response.json()["vendeurs"]
    
    def test_admin_dashboard_with_custom_period(self):
        """Admin dashboard should accept start_date and end_date params"""
        if not self.marathons:
            pytest.skip("No marathons found")
        
        marathon = self.marathons[0]
        response = requests.get(
            f"{BASE_URL}/api/dashboard/admin",
            params={
                "marathon_id": marathon["id"],
                "start_date": "2026-01-01",
                "end_date": "2026-12-31"
            },
            headers=self.headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "total_leads" in data
        assert "inscrits" in data
        assert "vendeur_stats" in data
    
    def test_vendeur_dashboard_with_custom_period(self):
        """Vendeur dashboard should accept start_date and end_date params"""
        if not self.marathons or not self.vendeurs:
            pytest.skip("No marathons or vendeurs found")
        
        marathon = self.marathons[0]
        vendeur = self.vendeurs[0]
        
        response = requests.get(
            f"{BASE_URL}/api/dashboard/vendeur",
            params={
                "marathon_id": marathon["id"],
                "vendeur_id": vendeur["id"],
                "start_date": "2026-01-01",
                "end_date": "2026-12-31"
            },
            headers=self.headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "total_leads" in data
        assert "inscrits" in data
        assert "objectif" in data


class TestPaymentMethods:
    """Tests for payment methods in leads"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get marathon"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={"code": "839271"})
        assert response.status_code == 200
        data = response.json()
        self.token = data["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        # Get active marathons
        marathons_response = requests.get(f"{BASE_URL}/api/marathons", headers=self.headers)
        assert marathons_response.status_code == 200
        self.marathons = marathons_response.json()["marathons"]
        
        # Get vendeurs
        vendeurs_response = requests.get(f"{BASE_URL}/api/users/vendeurs", headers=self.headers)
        assert vendeurs_response.status_code == 200
        self.vendeurs = vendeurs_response.json()["vendeurs"]
    
    def test_create_lead_with_moncash(self):
        """Create lead with MONCASH payment method"""
        if not self.marathons or not self.vendeurs:
            pytest.skip("No marathons or vendeurs found")
        
        lead_data = {
            "date": "2026-01-15",
            "full_name": "TEST_MONCASH_Lead",
            "phone": "50912345678",
            "payment_method": "MONCASH",
            "status": "Très intéressé",
            "address": "Port-au-Prince",
            "vendeur_id": self.vendeurs[0]["id"],
            "marathon_id": self.marathons[0]["id"]
        }
        
        response = requests.post(f"{BASE_URL}/api/leads", json=lead_data, headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data["lead"]["payment_method"] == "MONCASH"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/leads/{data['lead']['id']}", headers=self.headers)
    
    def test_create_lead_with_natcash(self):
        """Create lead with NATCASH payment method"""
        if not self.marathons or not self.vendeurs:
            pytest.skip("No marathons or vendeurs found")
        
        lead_data = {
            "date": "2026-01-15",
            "full_name": "TEST_NATCASH_Lead",
            "phone": "50912345679",
            "payment_method": "NATCASH",
            "status": "Très intéressé",
            "address": "Cap-Haïtien",
            "vendeur_id": self.vendeurs[0]["id"],
            "marathon_id": self.marathons[0]["id"]
        }
        
        response = requests.post(f"{BASE_URL}/api/leads", json=lead_data, headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data["lead"]["payment_method"] == "NATCASH"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/leads/{data['lead']['id']}", headers=self.headers)
    
    def test_create_lead_with_local(self):
        """Create lead with LOCAL payment method"""
        if not self.marathons or not self.vendeurs:
            pytest.skip("No marathons or vendeurs found")
        
        lead_data = {
            "date": "2026-01-15",
            "full_name": "TEST_LOCAL_Lead",
            "phone": "50912345680",
            "payment_method": "LOCAL",
            "status": "Inscrit",
            "address": "Pétion-Ville",
            "vendeur_id": self.vendeurs[0]["id"],
            "marathon_id": self.marathons[0]["id"]
        }
        
        response = requests.post(f"{BASE_URL}/api/leads", json=lead_data, headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data["lead"]["payment_method"] == "LOCAL"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/leads/{data['lead']['id']}", headers=self.headers)
