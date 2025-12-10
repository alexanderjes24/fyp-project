// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract DataRegistry {
    address public admin;

    // ===========================================
    // 1. Data Structures and Mappings for Medical Records
    // ===========================================
    struct RecordProof {
        string therapistId; // The therapist who authored the record (UID)
        string hash;        // SHA256 of the medical record data
        uint256 timestamp;
    }
    
    // Mapping for Medical Records (bookingId -> RecordProof struct)
    mapping(string => RecordProof) private medicalRecordProofs;

    event MedicalRecordAdded(string indexed bookingId, string therapistId, string hash, uint256 timestamp);

    // ===========================================
    // 2. Data Structures and Mappings for Therapist Credentials (THE MISSING PIECE)
    // ===========================================
    // Mapping for Credential Hash (therapistUid -> hash)
    mapping(string => string) private therapistCredentialHashes;
    // Mapping for Credential Timestamp (therapistUid -> timestamp)
    mapping(string => uint256) private credentialTimestamps;

    event CredentialStored(string indexed therapistUid, string hash, uint256 timestamp);

    // ===========================================
    // 3. Modifiers and Constructor
    // ===========================================
    modifier onlyAdmin() {
        // This ensures only the deploying address (your backend's wallet) can execute admin functions.
        require(msg.sender == admin, "DATEREG: Only admin (backend) can perform this action.");
        _;
    }

    constructor() {
        // Sets the deploying address as the admin
        admin = msg.sender;
    }

    // ===========================================
    // 4. Therapist Credential Functions (The Fix for the 500 Error)
    // ===========================================

    /**
     * @dev Stores the SHA256 hash of a therapist's approved credentials.
     * This function is the one that was missing and caused the backend error.
     * @param therapistUid The Firebase UID of the therapist.
     * @param hash The SHA256 hash of the approved credential data.
     */
    function storeCredential(
        string memory therapistUid, 
        string memory hash
    ) public onlyAdmin {
        require(bytes(therapistUid).length > 0, "DATEREG: Therapist UID required.");
        require(bytes(hash).length > 0, "DATEREG: Credential Hash required.");
        
        // Prevents overwriting an already stored credential hash
        require(bytes(therapistCredentialHashes[therapistUid]).length == 0, "DATEREG: Credential already stored.");

        therapistCredentialHashes[therapistUid] = hash;
        credentialTimestamps[therapistUid] = block.timestamp;

        emit CredentialStored(therapistUid, hash, block.timestamp);
    }

    /**
     * @dev Retrieves the stored hash and timestamp for a therapist's credential.
     * This corresponds to the getCredential function in your backend's credential.ts.
     * @param therapistUid The Firebase UID of the therapist.
     * @return hash The stored credential hash (or empty string if not found).
     * @return timestamp The time the hash was stored (or 0 if not found).
     */
    function getCredential(string memory therapistUid) 
        public 
        view 
        returns (string memory hash, uint256 timestamp) 
    {
        // Returns the stored hash and timestamp, or empty string/zero if not found.
        return (therapistCredentialHashes[therapistUid], credentialTimestamps[therapistUid]);
    }

    // ===========================================
    // 5. Medical Record Functions (Existing Logic)
    // ===========================================

    /**
     * @dev Stores the SHA256 hash of a completed medical record, keyed by booking ID.
     * @param bookingId The unique ID of the consultation/booking.
     * @param therapistId The UID of the therapist who created the record.
     * @param hash The SHA256 hash of the medical record data.
     */
    function addMedicalRecord(
        string memory bookingId,
        string memory therapistId,
        string memory hash
    ) public onlyAdmin {
        require(bytes(medicalRecordProofs[bookingId].hash).length == 0, "DATEREG: Record proof already exists for this booking ID.");
        require(bytes(bookingId).length > 0, "DATEREG: Booking ID cannot be empty.");
        require(bytes(therapistId).length > 0, "DATEREG: Therapist ID cannot be empty.");
        require(bytes(hash).length > 0, "DATEREG: Hash (proof) cannot be empty.");

        medicalRecordProofs[bookingId] = RecordProof(
            therapistId,
            hash,
            block.timestamp
        );
        emit MedicalRecordAdded(bookingId, therapistId, hash, block.timestamp);
    }

    /**
     * @dev Retrieves the stored proof for a medical record.
     * @param bookingId The unique ID of the consultation/booking.
     * @return therapistId The UID of the therapist.
     * @return hash The SHA256 hash of the medical record data.
     * @return timestamp The time the record was added.
     */
    function getMedicalRecordProof(string memory bookingId) 
        public 
        view 
        returns (string memory therapistId, string memory hash, uint256 timestamp) 
    {
        RecordProof storage proof = medicalRecordProofs[bookingId];
        
        // Checks if the record exists before returning
        require(bytes(proof.hash).length > 0, "DATEREG: Medical record proof not found for this ID.");

        return (proof.therapistId, proof.hash, proof.timestamp);
    }
}