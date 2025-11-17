// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Consent {
    struct ConsentRecord {
        bytes32 userHash;   // hashed user ID (so it's private)
        uint256 timestamp;  // when consent was given
    }

    ConsentRecord[] public records;

    event ConsentGiven(bytes32 indexed userHash, uint256 timestamp);

    function giveConsent(bytes32 userHash) public returns (uint256) {
        ConsentRecord memory newRecord = ConsentRecord({
            userHash: userHash,
            timestamp: block.timestamp
        });

        records.push(newRecord);

        emit ConsentGiven(userHash, block.timestamp);

        return records.length - 1; // record ID
    }

    function getConsent(uint256 id) public view returns (bytes32, uint256) {
        ConsentRecord memory r = records[id];
        return (r.userHash, r.timestamp);
    }

    function totalConsents() public view returns (uint256) {
        return records.length;
    }
}
