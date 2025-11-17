// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract TherapySessions {
    mapping(uint => string) public sessionHashes;
    uint public sessionCount;

    function storeSession(string memory hash) public {
        sessionHashes[sessionCount] = hash;
        sessionCount++;
    }
}
