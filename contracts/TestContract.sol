pragma solidity ^0.4.24;
pragma experimental ABIEncoderV2;

import "./tools/IexecODBLibOrders.sol";

import "./registries/Dapp.sol";
import "./registries/Data.sol";
import "./registries/Pool.sol";

contract TestContract
{
	using IexecODBLibOrders for *;

	/***************************************************************************
	 *                                Lib Proxy                                *
	 ***************************************************************************/
	function getDappOrderHash(IexecODBLibOrders.DappOrder _dapporder) public pure returns (bytes32) { return _dapporder.hash(); }
	function getDataOrderHash(IexecODBLibOrders.DataOrder _dataorder) public pure returns (bytes32) { return _dataorder.hash(); }
	function getPoolOrderHash(IexecODBLibOrders.PoolOrder _poolorder) public pure returns (bytes32) { return _poolorder.hash(); }
	function getUserOrderHash(IexecODBLibOrders.UserOrder _userorder) public pure returns (bytes32) { return _userorder.hash(); }

	/***************************************************************************
	 *                            EIP712 signature                             *
	 ***************************************************************************/
	bytes32 public EIP712DOMAIN_SEPARATOR;

	function verifySignature(
		address _signer,
		bytes32 _hash,
		IexecODBLibOrders.signature _signature)
	public view returns (bool)
	{
		return _signer == ecrecover(keccak256(abi.encodePacked("\x19\x01", EIP712DOMAIN_SEPARATOR, _hash)), _signature.v, _signature.r, _signature.s);
	}

	function checkDappOrder(IexecODBLibOrders.DappOrder _dapporder) public view returns (bool) { return verifySignature(Dapp(_dapporder.dapp).m_owner(), _dapporder.hash(), _dapporder.sign); }
	function checkDataOrder(IexecODBLibOrders.DataOrder _dataorder) public view returns (bool) { return verifySignature(Data(_dataorder.data).m_owner(), _dataorder.hash(), _dataorder.sign); }
	function checkPoolOrder(IexecODBLibOrders.PoolOrder _poolorder) public view returns (bool) { return verifySignature(Pool(_poolorder.pool).m_owner(), _poolorder.hash(), _poolorder.sign); }
	function checkUserOrder(IexecODBLibOrders.UserOrder _userorder) public view returns (bool) { return verifySignature(_userorder.requester,            _userorder.hash(), _userorder.sign); }

	/***************************************************************************
	 *                               Constructor                               *
	 ***************************************************************************/

	// constructor(EIP712Domain _domain) public { EIP712DOMAIN_SEPARATOR = domain.hash(); }

	constructor()
	public
	{
		EIP712DOMAIN_SEPARATOR = IexecODBLibOrders.EIP712Domain({
			name:              "iExecODB"
		, version:           "3.0-alpha"
		, chainId:           1
		, verifyingContract: this
		}).hash();
	}


}
