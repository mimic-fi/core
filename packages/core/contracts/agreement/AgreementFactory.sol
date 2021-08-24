// SPDX-License-Identifier: GPL-3.0-or-later
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

pragma solidity ^0.8.0;

import "./Agreement.sol";

contract AgreementFactory  {
    address public immutable vault;
    mapping (address => bool) public isAgreement;

    event AgreementCreated(address indexed agreement, string name);

    constructor(address _vault) {
        vault = _vault;
    }

    function create(
        string memory _name,
        uint256 _depositFee,
        uint256 _performanceFee,
        address _feeCollector,
        uint256 _maxSwapSlippage,
        address[] memory _managers,
        address[] memory _withdrawers,
        Agreement.AllowedStrategies _allowedStrategies,
        address[] memory _customStrategies
    ) external {
        Agreement agreement = new Agreement(_name, vault, _depositFee, _performanceFee, _feeCollector, _maxSwapSlippage, _managers, _withdrawers, _allowedStrategies, _customStrategies);
        isAgreement[address(agreement)] = true;
        emit AgreementCreated(address(agreement), _name);
    }
}
