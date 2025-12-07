// contracts/DataRegistry.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract DataRegistry {
    address public admin;

    // ... (Existing mappings and events for Credentials) ...

    struct RecordProof {
        string therapistId; // The therapist who authored the record
        string hash;        // SHA256 of the medical record data
        uint256 timestamp;
    }

    // Mapping for Medical Records (bookingId -> RecordProof struct)
    mapping(string => RecordProof) private medicalRecordProofs;

    event MedicalRecordAdded(string indexed bookingId, string therapistId, string hash, uint256 timestamp);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    // ... (Existing addCredential function) ...

    // --- UPDATED Medical Record Function ---
    // The Admin (backend) calls this, but includes the *actual* therapist ID in the data.
    function addMedicalRecord(
        string memory bookingId,
        string memory therapistId,
        string memory hash
    ) public onlyAdmin {
        medicalRecordProofs[bookingId] = RecordProof(
            therapistId,
            hash,
            block.timestamp
        );
        emit MedicalRecordAdded(bookingId, therapistId, hash, block.timestamp);
    }

    function getMedicalRecordProof(string memory bookingId) 
        public 
        view 
        returns (string memory therapistId, string memory hash, uint256 timestamp) 
    {
        RecordProof storage proof = medicalRecordProofs[bookingId];
        return (proof.therapistId, proof.hash, proof.timestamp);
    }
}