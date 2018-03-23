pragma solidity ^0.4.18;

import './Closable.sol';
import './IexecHubAccessor.sol';

contract App is Closable, IexecHubAccessor // Owned by a D(w)
{

	/**
	 * Members
	 */
	string        public m_appName;
	uint256       public m_appPrice;
	string        public m_appParams;

	/**
	 * Constructor
	 */
	function App(
		address _iexecHubAddress,
		string  _appName,
		uint256 _appPrice,
		string  _appParams)
	IexecHubAccessor(_iexecHubAddress)
	public
	{
		// tx.origin == owner
		// msg.sender == DatasetHub
		require(tx.origin != msg.sender);
		transferOwnership(tx.origin); // owner → tx.origin

		m_appName   = _appName;
		m_appPrice  = _appPrice;
		m_appParams = _appParams;

	}



}
