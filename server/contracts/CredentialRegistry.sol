// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CredentialRegistry {
    struct Credential {
        string uid;
        string hash; // SHA256 of credential data
        uint256 timestamp;
    }

    mapping(string => Credential) public credentials; // uid => credential

    event CredentialStored(string uid, string hash, uint256 timestamp);

    function storeCredential(string memory uid, string memory hash) public {
        require(bytes(uid).length > 0, "UID required");
        require(bytes(hash).length > 0, "Hash required");

        credentials[uid] = Credential(uid, hash, block.timestamp);
        emit CredentialStored(uid, hash, block.timestamp);
    }

    function getCredential(string memory uid) public view returns (string memory, uint256) {
        Credential memory cred = credentials[uid];
        return (cred.hash, cred.timestamp);
    }
}
