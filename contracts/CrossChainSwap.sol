// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "wormhole-solidity-sdk/WormholeRelayerSDK.sol";
import "wormhole-solidity-sdk/interfaces/IWormholeRelayer.sol";

contract CrossChainSwap is TokenSender, TokenReceiver {
    uint256 constant GAS_LIMIT = 2_500_000;

    constructor(
        address _wormholeRelayer,
        address _tokenBridge,
        address _wormhole
    ) TokenBase(_wormholeRelayer, _tokenBridge, _wormhole) {}

    function quoteCrossChainDeposit(uint16 targetChain)
        public
        view
        returns (uint256 cost)
    {
        // Cost of delivering token and payload to targetChain
        uint256 deliveryCost;
        (deliveryCost, ) = wormholeRelayer.quoteEVMDeliveryPrice(
            targetChain,
            0,
            GAS_LIMIT
        );

        // Total cost: delivery cost + cost of publishing the 'sending token' wormhole message
        cost = deliveryCost + wormhole.messageFee();
    }

    function sendCrossChainDeposit(
        uint16 targetChain,
        address targetToken,
        address recipient,
        uint256 amount,
        address token,
        uint16 refundChain,
        address refundAddress
    ) public payable {
        uint256 cost = quoteCrossChainDeposit(targetChain);
        require(
            msg.value == cost,
            "msg.value must be quoteCrossChainDeposit(targetChain)"
        );

        IERC20(token).transferFrom(msg.sender, address(this), amount);

        bytes memory payload = abi.encode(recipient);
        sendTokenWithPayloadToEvm(
            targetChain,
            targetToken, // address (on targetChain) to send token and payload to
            payload,
            0, // receiver value
            GAS_LIMIT,
            token, // address of IERC20 token contract
            amount,
            refundChain, 
            refundAddress
        );
    }

    function sendNativeCrossChainDeposit(
        uint16 targetChain,
        address targetToken,
        address recipient,
        uint256 amount,
        uint16 refundChain,
        address refundAddress
    ) public payable {
  
        IWETH wrappedNativeToken = tokenBridge.WETH();
        wrappedNativeToken.deposit{value: amount}();

        bytes memory payload = abi.encode(recipient);
        sendTokenWithPayloadToEvm(
            targetChain,
            targetToken, // address (on targetChain) to send token and payload to
            payload,
            0, // receiver value
            GAS_LIMIT,
            address(wrappedNativeToken), // address of IERC20 token contract
            amount,
            refundChain, 
            refundAddress
        );
    }


    function receivePayloadAndTokens(
        bytes memory payload,
        TokenReceived[] memory receivedTokens,
        bytes32, // sourceAddress
        uint16,
        bytes32 // deliveryHash
    ) internal override onlyWormholeRelayer {
        require(receivedTokens.length == 1, "Expected 1 token transfers");

        address recipient = abi.decode(payload, (address));

        IERC20(receivedTokens[0].tokenAddress).transfer(
            recipient,
            receivedTokens[0].amount
        );
    }
}
