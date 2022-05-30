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

import '../Proxy.sol';
import './Agreement.sol';

contract AgreementFactory {
    address public immutable vault;
    address public immutable implementation;
    mapping (address => bool) public isAgreement;

    event AgreementCreated(address indexed agreement, string name);

    constructor(IWETH _weth, address _vault) {
        vault = _vault;
        implementation = address(new Agreement(_weth));
    }

    function create(
        string memory _name,
        address _feeCollector,
        uint256 _depositFee,
        uint256 _withdrawFee,
        uint256 _performanceFee,
        uint256 _maxSwapSlippage,
        address[] memory _managers,
        address[] memory _withdrawers,
        address[] memory _customTokens,
        Agreement.Allowed _allowedTokens,
        address[] memory _customStrategies,
        Agreement.Allowed _allowedStrategies
    ) external {
        address payable agreement = payable(new Proxy(implementation));
        Agreement(agreement).initialize(
            vault,
            _feeCollector,
            _depositFee,
            _withdrawFee,
            _performanceFee,
            _maxSwapSlippage,
            _managers,
            _withdrawers,
            _customTokens,
            _allowedTokens,
            _customStrategies,
            _allowedStrategies
        );
        isAgreement[agreement] = true;
        emit AgreementCreated(agreement, _name);
    }
}