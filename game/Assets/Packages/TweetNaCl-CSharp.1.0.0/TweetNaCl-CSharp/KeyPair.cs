﻿/*
 *This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 */

using System;

namespace NaCl
{
    public class KeyPair
    {
        public Byte[] PublicKey { get; protected set; }
        public Byte[] SecretKey { get; protected set; }

        public KeyPair(Byte[] publicKey, Byte[] secretKey)
        {
            this.PublicKey = publicKey;
            this.SecretKey = secretKey;
        }
    }
}