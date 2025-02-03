import React, { useState, useEffect } from 'react';
import './Dashboard.css';

const Dashboard = () => {

  const [searchQuery, setSearchQuery] = useState('');
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [documentVerifications, setDocumentVerifications] = useState([]);
  const [driverProfiles, setDriverProfiles] = useState([]);
  const [riderProfiles, setRiderProfiles] = useState([]);
  const [activeScreen, setActiveScreen] = useState('pendingVerification');
 

  const driversApiURL = 'http://localhost:4000/drivers';
  const ridersApiURL = 'http://localhost:4000/riders';

 // Filter functions for each profile category
 const filterProfiles = (profiles) => {
  return profiles.filter((profile) => {
    const fullName = `${profile.basicInfo?.firstName || ''} ${profile.basicInfo?.lastName || ''}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });
};

const filteredPendingVerificationsWithSearch = filterProfiles(pendingVerifications);
const filteredDocumentVerificationsWithSearch = filterProfiles(documentVerifications);
const filteredDriverProfilesWithSearch = filterProfiles(driverProfiles);
const filteredRiderProfilesWithSearch = filterProfiles(riderProfiles);

  
  useEffect(() => {
    const fetchDriverProfiles = async () => {
      try {
        const response = await fetch(driversApiURL);
        const data = await response.json();
        setDriverProfiles(data);
  
        // Filter verified and pending drivers after the update
        const verifiedDrivers = data.filter(driver => driver.verification === 'verified');
        const pendingDrivers = data.filter(driver => driver.verification === 'pending');
  
        // Update the states with the filtered drivers
        setDocumentVerifications(verifiedDrivers);
        setPendingVerifications(pendingDrivers);
      } catch (error) {
        console.error('Error fetching driver profiles:', error);
      }
    };
  
    const fetchRiderProfiles = async () => {
      try {
        const response = await fetch(ridersApiURL);
        const data = await response.json();
        setRiderProfiles(data);  // Update the state with fetched rider profiles
      } catch (error) {
        console.error('Error fetching rider profiles:', error);
      }
    };
  
    // Fetch the data when the component mounts or after an update to the driver list
    fetchDriverProfiles();
    fetchRiderProfiles();
  }, [driversApiURL, ridersApiURL]);  // Include API URLs as dependencies if needed
  
  const handleCheckVehicleDetails = (profile) => {
    // Extract the vehicle number from the profile
    const vehicleNumber = profile.vehicle?.bikeInfo?.vehicleNumber || profile.vehicle?.carInfo?.vehicleNumber || '';
  
    // Check if the vehicle number exists
    if (vehicleNumber) {
      // Construct the URL with the correct query parameter name (`vhlno`)
      const vehicleCheckUrl = `https://mtmis.excise.punjab.gov.pk/?vhlno=${vehicleNumber}`;
      window.open(vehicleCheckUrl, '_blank');
    } else {
      // Alert the user if no vehicle number is found
      alert('Vehicle number not found.');
    }
  };

  const handleApprove = async (profile) => {
    if (profile.verification === 'verified') {
        alert('This driver is already verified.');
        return;
    }

    try {
        const response = await fetch(`http://localhost:4000/approve/approveVerification/${profile._id}`, {
            method: 'PUT',  // Using PUT request as per backend changes
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                verification: 'verified', // Update verification status
            }),
        });

        const data = await response.json();

        if (response.ok) {
            // Update the state to reflect the change
            const updatedProfile = { ...profile, verification: 'verified' };
            setDocumentVerifications(prev => [...prev, updatedProfile]);
            setPendingVerifications(prev => prev.filter(driver => driver._id !== profile._id));

            alert('Driver approved and verification status updated to "verified".');
        } else {
            // Handle API error response
            console.error('Error:', data.message);
            alert(`Error: ${data.message}`);
        }
    } catch (error) {
        console.error('Error approving driver:', error);
        alert('An error occurred while approving the driver.');
    }
};


const handleReject = async (profile) => {
  try {
    const response = await fetch(`http://localhost:4000/reject/rejectVerification/${profile._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ verification: 'rejected' }),
    });

    const data = await response.json();

    if (response.ok) {
      // Remove the driver from pending verifications
      setPendingVerifications((prev) =>
        prev.filter((driver) => driver._id !== profile._id)
      );

      alert('Driver Rejected and status updated to "rejected".');
    } else {
      console.error('Error:', data.message);
      alert(`Error: ${data.message}`);
    }
  } catch (error) {
    console.error('Error rejecting driver:', error);
    alert('An error occurred while rejecting the driver.');
  }
};

const handleViewProfile = (profile) => {
  const profileWindow = window.open('', '_blank', 'width=800,height=800');
  const profileDetails = `
    <html>
      <head>
        <style>
          body {
            font-family: 'Roboto', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 30px;
            color: #444;
            background-color: #f9f9f9;
            margin: 0;
            box-sizing: border-box;
          }

          h2 {
            color: #007bff;
            text-align: center;
            font-size: 30px;
            margin-bottom: 20px;
            font-weight: bold;
          }

          p {
            font-size: 18px;
            margin: 15px 0;
          }

          strong {
            color: #007bff;
            font-weight: bold;
          }

          .profile-container {
            max-width: 700px;
            margin: 0 auto;
            background-color: #fff;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }

          .profile-footer {
            text-align: center;
            font-size: 14px;
            color: #888;
            margin-top: 30px;
          }

          /* Mobile responsiveness */
          @media (max-width: 768px) {
            h2 {
              font-size: 24px;
            }

            p {
              font-size: 16px;
            }
          }
        </style>
      </head>
      <body>
        <div class="profile-container">
          <h2>Profile Details</h2>
            <img src="${profile.basicInfo?.profileImage}" alt="Profile Image" style="width: 150px; height: 150px; border-radius: 50%;" />
          <p><strong>Name:</strong> ${profile.basicInfo?.firstName} ${profile.basicInfo?.lastName}</p>
          <p><strong>Email:</strong> ${profile.basicInfo?.email}</p>
          <p><strong>Gender:</strong> ${profile.basicInfo?.gender}</p>
          <p><strong>Address:</strong> ${profile.basicInfo?.address}</p>
          <p><strong>Date of Birth:</strong> ${new Date(profile.basicInfo?.dateOfBirth).toLocaleDateString()}</p>
          <p><strong>CNIC Number:</strong> ${profile.cnic?.cnicNumber}</p>
          <p><strong>License Number:</strong> ${profile.license?.licenseNumber}</p>
          <img src="${profile.license.frontImage}" alt="Front Image" style="width: 150px; height: 150px;" />
          <img src="${profile.license.backImage}" alt="Back Image" style="width: 150px; height: 150px;" />
          <p><strong>License Issue Date:</strong> ${new Date(profile.license?.issueDate).toLocaleDateString()}</p>
          <p><strong>License Expiry Date:</strong> ${new Date(profile.license?.expiryDate).toLocaleDateString()}</p>
          <p><strong>Vehicle Type:</strong> ${profile.vehicle?.type}</p>
             <img src="${profile.vehicle.bikeInfo.front}" alt="Front Image" style="width: 150px; height: 150px;" />
            <img src="${profile.vehicle.bikeInfo.back}" alt="Back Image" style="width: 150px; height: 150px;" />
            <img src="${profile.vehicle.bikeInfo.right}" alt="Right Image" style="width: 150px; height: 150px;" />
            <img src="${profile.vehicle.bikeInfo.left}" alt="Left  Image" style="width: 150px; height: 150px;" />
            ${
            profile.vehicle?.type === 'Bike'
              ? `
                <p><strong>Vehicle Number:</strong> ${profile.vehicle.bikeInfo?.vehicleNumber}</p>
                <p><strong>Company:</strong> ${profile.vehicle.bikeInfo?.company}</p>
                <p><strong>Model:</strong> ${profile.vehicle.bikeInfo?.model}</p>
                <p><strong>Chassis Number:</strong> ${profile.vehicle.bikeInfo?.chassisNumber}</p>
                <p><strong>Engine Number:</strong> ${profile.vehicle.bikeInfo?.engineNumber}</p>
              `
              : profile.vehicle?.type === 'Car'
              ? `
                <p><strong>Company:</strong> ${profile.vehicle.carInfo?.company}</p>
                <p><strong>Model:</strong> ${profile.vehicle.carInfo?.model}</p>
                <p><strong>Chassis Number:</strong> ${profile.vehicle.carInfo?.chassisNumber}</p>
                <p><strong>Engine Number:</strong> ${profile.vehicle.carInfo?.engineNumber}</p>
              `
              : ''
          }
          <p><strong>Joined On:</strong> ${new Date(profile.createdAt).toLocaleDateString()}</p>
          <div class="profile-footer">Profile information is up to date.</div>
        </div>
      </body>
    </html>
  `;
  profileWindow.document.write(profileDetails);
};

  
  const handleViewProfile1 = (profile) => {
    const profileWindow = window.open('', '_blank', 'width=600,height=600');
    const profileDetails = `
      <html>
        <head>
          <style>
            body {
              font-family: 'Roboto', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              padding: 30px;
              color: #444;
              background-color: #f9f9f9;
              margin: 0;
              box-sizing: border-box;
            }
  
            h2 {
              color: #007bff;
              text-align: center;
              font-size: 30px;
              margin-bottom: 20px;
              font-weight: bold;
            }
  
            p {
              font-size: 18px;
              margin: 15px 0;
            }
  
            strong {
              color: #007bff;
              font-weight: bold;
            }
  
            .profile-container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #fff;
              padding: 20px;
              border-radius: 12px;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
  
            .profile-footer {
              text-align: center;
              font-size: 14px;
              color: #888;
              margin-top: 30px;
            }
  
            /* Mobile responsiveness */
            @media (max-width: 768px) {
              h2 {
                font-size: 24px;
              }
  
              p {
                font-size: 16px;
              }
            }
          </style>
        </head>
        <body>
          <div class="profile-container">
            <h2>Profile Details</h2>
            <p><strong>Name:</strong> ${profile.firstName} ${profile.lastName}</p>
            <p><strong>Email:</strong> ${profile.email}</p>
            <p><strong>Phone Number:</strong> ${profile.phoneNumber}</p>
            <p><strong>Date of Birth:</strong> ${new Date(profile.dob).toLocaleDateString()}</p>
            <p><strong>Joined On:</strong> ${new Date(profile.createdAt).toLocaleDateString()}</p>
            <div class="profile-footer">Profile information is up to date.</div>
          </div>
        </body>
      </html>
    `;
    profileWindow.document.write(profileDetails);
  };
  
  
  const handleCheck = (profile) => {
    // Clean the CNIC by removing dashes
    const cnicNumber = profile.cnic?.cnicNumber?.replace(/-/g, ''); 
    const cleanLicense = profile.license?.licenseNumber || '';

    // Construct the verification URL
    const verifyUrl = `https://dlims.punjab.gov.pk/verify?cnic=${cnicNumber}&license=${cleanLicense}`;

    // Open the verification page
    window.open(verifyUrl, '_blank');
  };

  const filteredPendingVerifications = pendingVerifications
  ? pendingVerifications.filter(driver => driver.verification=== 'pending'):[];
  const filteredDocumentVerifications = documentVerifications
  ? documentVerifications.filter(driver => driver.verification === 'verified'):[];
  const filteredDriverProfiles = filterProfiles(driverProfiles);
  const filteredRiderProfiles = filterProfiles(riderProfiles);

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <h2>Dashboard</h2>
        <ul className="sidebar-menu">
          <button className="btn" onClick={() => setActiveScreen('pendingVerification')}>
            Pending Verification
          </button>
          <button className="btn" onClick={() => setActiveScreen('documentVerification')}>
            Document Verification
          </button>
          <button className="btn" onClick={() => setActiveScreen('driverProfiles')}>
            Driver Profiles
          </button>
          <button className="btn" onClick={() => setActiveScreen('riderProfiles')}>
            Rider Profiles
          </button>
        </ul>
      </aside>
      

      <main className="main-content">
        <header className="dashboard-header">
          <h1>
            {activeScreen === 'pendingVerification'
              ? 'Pending Verification'
              : activeScreen === 'documentVerification'
              ? 'Document Verification'
              : activeScreen === 'driverProfiles'
              ? 'Driver Profiles'
              : 'Rider Profiles'}
          </h1>
          <div className="search-bar1">
          <input
  type="text"
  placeholder="Search"
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
/>
</div>
        </header>

        {activeScreen === 'pendingVerification' && (
      <section className="pending-verification-section">
        <div className="profile-grid1">
          {filteredPendingVerificationsWithSearch.map((profile) => (
            <div key={profile._id} className="profile-card1">
              <h3>
                {profile.basicInfo?.firstName || 'Unknown'}{' '}
                {profile.basicInfo?.lastName || 'User'}
              </h3>
              <p>Email: {profile.basicInfo?.email || 'N/A'}</p>
              <button className="approve-button" onClick={() => handleApprove(profile)}>
                Approve
              </button>
              <button className="reject-button" onClick={() => handleReject(profile)}>
                Reject
              </button>
              <button className="check-button" onClick={() => handleCheck(profile)}>
                Check License/CNIC Details
              </button>
              <button
                className="check-button1"
                onClick={() => handleCheckVehicleDetails(profile)}
              >
                Check Vehicle Details
              </button>
            </div>
          ))}
        </div>
      </section>
    )}

{activeScreen === 'documentVerification' && (
        <section className="document-verification-section">
          <div className="profile-grid">
            {filteredDocumentVerificationsWithSearch.map((profile) => (
              <div key={profile._id} className="profile-card">
                <h3>{profile.basicInfo?.firstName || 'Verified User'}</h3>
                <button onClick={() => handleViewProfile(profile)}>View Profile</button>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeScreen === 'driverProfiles' && (
        <section className="driver-profiles-section">
          <div className="profile-grid">
            {filteredDriverProfilesWithSearch.map((profile) => (
              <div key={profile._id} className="profile-card">
                <h3>{profile.basicInfo?.firstName || 'Driver'}</h3>
                <button onClick={() => handleViewProfile(profile)}>View Profile</button>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeScreen === 'riderProfiles' && (
        <section className="rider-profiles-section">
          <div className="profile-grid">
            {filteredRiderProfilesWithSearch.map((profile) => (
              <div key={profile._id} className="profile-card">
                     <h3>{profile.firstName || 'Rider'} {profile.lastName || ''}</h3>
                <button onClick={() => handleViewProfile1(profile)}>View Profile</button>
              </div>
            ))}
          </div>
        </section>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
