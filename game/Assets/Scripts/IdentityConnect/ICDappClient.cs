using System;
using System.Text;
using UnityEngine;
using System.Threading.Tasks;
using System.Net.Http;
using Newtonsoft.Json;
using System.Net;
using Newtonsoft.Json.Linq;
using UnityEditor;

using TweetNaCl;

using Chaos.NaCl.Internal.Ed25519Ref10;
using Chaos.NaCl;
using Org.BouncyCastle.Crypto.Digests;
using System.Linq;

public class ICCrypto
{
  public static KeyPair generateEd25519Keypair()
  {
    var random = new System.Random();
    var seed = new byte[32];
    random.NextBytes(seed);

    Chaos.NaCl.Ed25519.KeyPairFromSeed(out var publicKey, out var secretKey, seed);
    return new KeyPair(publicKey, secretKey);
  }

  public static byte[] convertPublicKey(byte[] ed25519PublicKey)
  {
    FieldElement montgomeryX, edwardsY, edwardsZ;
    FieldOperations.fe_frombytes(out edwardsY, ed25519PublicKey, 0);
    FieldOperations.fe_1(out edwardsZ);

    MontgomeryCurve25519.EdwardsToMontgomeryX(out montgomeryX, ref edwardsY, ref edwardsZ);

    byte[] convertedPublicKey = new byte[32];
    FieldOperations.fe_tobytes(convertedPublicKey, 0, ref montgomeryX);
    return convertedPublicKey;
  }

  // public static AsymmetricCipherKeyPair GenerateX25519Keys()
  // {
  //   var generator = new X25519KeyPairGenerator();
  //   var keyGenerationParams = new KeyGenerationParameters(new SecureRandom(new CryptoApiRandomGenerator()), 1024);
  //   generator.Init(keyGenerationParams);
  //   return generator.GenerateKeyPair();
  // }

  // public static AsymmetricCipherKeyPair GenerateEd25519Keys()
  // {
  //   var generator = new Ed25519KeyPairGenerator();
  //   var keyGenerationParams = new KeyGenerationParameters(new SecureRandom(new CryptoApiRandomGenerator()), 1024);
  //   generator.Init(keyGenerationParams);
  //   return generator.GenerateKeyPair();
  //   // PrivateKeyInfo pkInfo = PrivateKeyInfoFactory.CreatePrivateKeyInfo(keyPair.Private);
  //   // String privateKey = Convert.ToBase64String(pkInfo.GetDerEncoded());

  //   // SubjectPublicKeyInfo info = SubjectPublicKeyInfoFactory.CreateSubjectPublicKeyInfo(keyPair.Public);
  //   // String publicKey = Convert.ToBase64String(info.GetDerEncoded());
  // }

  // public static AsymmetricCipherKeyPair GenerateX25519Keys()
  // {
  //   var generator = new X25519KeyPairGenerator();
  //   var keyGenerationParams = new KeyGenerationParameters(new SecureRandom(new CryptoApiRandomGenerator()), 1024);
  //   generator.Init(keyGenerationParams);
  //   return generator.GenerateKeyPair();
  // }

  // public static string EncodeSecretKeyToB64(AsymmetricKeyParameter secretKey)
  // {
  //   var pkInfo = PrivateKeyInfoFactory.CreatePrivateKeyInfo(secretKey);
  //   return Convert.ToBase64String(pkInfo.GetDerEncoded());
  // }

  // public static string EncodePublicKeyToB64(AsymmetricKeyParameter publicKey)
  // {
  //   var info = SubjectPublicKeyInfoFactory.CreateSubjectPublicKeyInfo(publicKey);
  //   return Convert.ToBase64String(info.GetDerEncoded());
  // }
}

public struct SerializedEncryptionResult
{
  public string nonceB64;
  public string securedB64;
}

public struct EnvelopeMetadata
{
  public string receiverEd25519PublicKeyB64;
  public string senderEd25519PublicKeyB64;
  public string senderX25519PublicKeyB64;
  public int sequence;
  public long timestampMillis;
}

public struct SecuredEnvelopeTransport
{
  public SerializedEncryptionResult encryptedPrivateMessage;
  public string messageSignature;
  public string serializedPublicMessage;
}

public class ICSecuredEnvelopeBuilder
{
  KeyPair senderEd25519KeyPair;
  byte[] receiverEd25519PublicKey;
  KeyPair senderX25519KeyPair;

  string senderEd25519SecretKeyB64;
  string senderEd25519PublicKeyB64;
  string receiverEd25519PublicKeyB64;
  string senderX25519SecretKeyB64;
  string senderX25519PublicKeyB64;

  public ICSecuredEnvelopeBuilder(KeyPair senderEd25519KeyPair, byte[] receiverEd25519PublicKey)
  {
    this.senderEd25519KeyPair = senderEd25519KeyPair;
    this.receiverEd25519PublicKey = receiverEd25519PublicKey;
    this.senderX25519KeyPair = TweetNaCl.TweetNaCl.CryptoBoxKeypair();

    this.senderEd25519SecretKeyB64 = Convert.ToBase64String(this.senderEd25519KeyPair.SecretKey);
    this.senderEd25519PublicKeyB64 = Convert.ToBase64String(this.senderEd25519KeyPair.PublicKey);
    this.receiverEd25519PublicKeyB64 = Convert.ToBase64String(this.receiverEd25519PublicKey);
    this.senderX25519SecretKeyB64 = Convert.ToBase64String(this.senderX25519KeyPair.SecretKey);
    this.senderX25519PublicKeyB64 = Convert.ToBase64String(this.senderX25519KeyPair.PublicKey);
  }

  private EnvelopeMetadata constructMetadata(int sequence)
  {
    var timestampMillis = new DateTimeOffset(DateTime.Now.ToUniversalTime()).ToUnixTimeMilliseconds();
    return new EnvelopeMetadata
    {
      receiverEd25519PublicKeyB64 = this.receiverEd25519PublicKeyB64,
      senderEd25519PublicKeyB64 = this.senderEd25519PublicKeyB64,
      senderX25519PublicKeyB64 = this.senderX25519PublicKeyB64,
      sequence = sequence,
      timestampMillis = timestampMillis,
    };
  }

  private (byte[], byte[]) encryptObject<T>(T message)
  {
    var serializedMessage = JsonConvert.SerializeObject(message);
    return encryptMessage(serializedMessage);
  }

  private (byte[], byte[]) encryptMessage(string message)
  {
    byte[] nonce = new byte[TweetNaCl.TweetNaCl.BoxNonceBytes];
    TweetNaCl.TweetNaCl.RandomBytes(nonce);

    var messageBytes = Encoding.UTF8.GetBytes(message);

    var receiverX25519PublicKey = ICCrypto.convertPublicKey(this.receiverEd25519PublicKey);
    var secured = TweetNaCl.TweetNaCl.CryptoBox(messageBytes, nonce, this.receiverEd25519PublicKey, this.senderX25519KeyPair.SecretKey);
    return (nonce, secured);
  }

  private string toHex(byte[] bytes)
  {
    return "0x" + string.Concat(bytes.Select(b => b.ToString("x2")).ToArray());
  }

  private byte[] concatBytes(byte[] lhs, byte[] rhs)
  {
    byte[] result = new byte[lhs.Length + rhs.Length];
    Buffer.BlockCopy(lhs, 0, result, 0, lhs.Length);
    Buffer.BlockCopy(rhs, 0, result, lhs.Length, rhs.Length);
    return result;
  }

  private byte[] sha3_256(byte[] input)
  {
    Sha256Digest sha256Digest = new Sha256Digest();
    sha256Digest.BlockUpdate(input, 0, input.Length);
    var output = new byte[sha256Digest.GetDigestSize()];
    sha256Digest.DoFinal(output, 0);
    return output;
  }

  public SecuredEnvelopeTransport encryptAndSignEnvelope<TPublic, TPrivate>(int sequenceNumber, TPublic publicMessage, TPrivate privateMessage)
  {
    var (nonce, secured) = encryptObject(privateMessage);
    var nonceB64 = Convert.ToBase64String(nonce);
    var securedB64 = Convert.ToBase64String(nonce);
    var encryptedPrivateMessage = new SerializedEncryptionResult { nonceB64 = nonceB64, securedB64 = securedB64 };

    var metadata = this.constructMetadata(sequenceNumber);
    var jsonMetadata = JObject.FromObject(metadata);
    var jsonPublicMessage = JObject.FromObject(publicMessage);
    jsonPublicMessage.Add("_metadata", jsonMetadata);
    var serializedPublicMessage = JsonConvert.SerializeObject(jsonPublicMessage);

    var privateMessageBytes = secured;
    var publicMessageBytes = Encoding.UTF8.GetBytes(serializedPublicMessage);

    var publicHash = sha3_256(publicMessageBytes);
    var privateHash = sha3_256(privateMessageBytes);
    byte[] combinedHash = concatBytes(publicHash, privateHash);

    var messageHashBytes = sha3_256(combinedHash);

    var prefix = "APTOS::IDENTITY_CONNECT::SECURED_ENVELOPE::";
    var prefixBytes = Encoding.UTF8.GetBytes(prefix);
    var hashedPrefix = sha3_256(prefixBytes);

    var finalMessage = sha3_256(concatBytes(hashedPrefix, messageHashBytes));

    var signatureBytes = TweetNaCl.TweetNaCl.CryptoSign(finalMessage, this.senderEd25519KeyPair.SecretKey);

    var messageSignature = toHex(signatureBytes);

    return new SecuredEnvelopeTransport
    {
      encryptedPrivateMessage = encryptedPrivateMessage,
      messageSignature = messageSignature,
      serializedPublicMessage = serializedPublicMessage
    };
  }

}

public class ICDappClient
{
  private const string DAPP_ID = "12345678-b4e1-4ddf-9c59-3b406b5b5e2a";
  private const string DAPP_HOSTNAME = "https://aptos-star-fighter.com";
  private const string BASE_URL = "https://identity-connect.staging.gcp.aptosdev.com";

  private HttpClient _httpClient = new HttpClient();
  private ICPairingData? IcPairing
  {
    get => new ICPairingData
    {
      accountAddress = "0xc548e1a9be477f2dd3ec381da1e000a3b1108d86c7f847f70fa54002ddcf72b8",
      accountEd25519PublicKeyB64 = "DA9svayWjeDsRowHK8DS/3Ra5MfMfnx4MEuU/pgWZGA=",
      accountTransportEd25519PublicKeyB64 = "8uLgS1rKdR+DV8HLdmP3V3ItIRzEt1KD/Pk/LcjrlOI=",
      currSequenceNumber = 0,
      dappEd25519SecretKeyB64 = "u5kO8AXtLG+dCd5jYDPdYW8+yMbPDqxoF8JhlH4DY2YmPJG7YlfuM3yUZnLRrMTiyUUgH3iE8eBONcvhbW78fA==",
      dappEd25519PublicKeyB64 = "JjyRu2JX7jN8lGZy0azE4slFIB94hPHgTjXL4W1u/Hw=",
      pairingId = "2ce68e0b-963a-4b87-8cbd-d24f77c99480",
    };
    set => GameState.Set<ICPairingData>("icPairing", value);
  }

  public ICDappClient()
  {
    this._httpClient.DefaultRequestHeaders.Referrer = new System.Uri(DAPP_HOSTNAME);
  }

  private async Task<string> createPairingRequest(string dappEd25519PublicKeyB64)
  {
    var serializedBody = JsonConvert.SerializeObject(new
    {
      dappEd25519PublicKeyB64,
      dappId = DAPP_ID,
    });
    var content = new StringContent(serializedBody, Encoding.UTF8, "application/json");
    var response = await this._httpClient.PostAsync($"{BASE_URL}/v1/pairing", content);
    var serializedResponseBody = await response.Content.ReadAsStringAsync();
    var responseBody = JsonConvert.DeserializeObject<JObject>(serializedResponseBody);

    if (response.StatusCode != HttpStatusCode.OK)
    {
      throw new HttpRequestException(responseBody.Value<string>("message"));
    }

    return responseBody["data"]["pairing"].Value<string>("id");
  }

  private async Task createSigningRequest<TRequestBody>(string type, TRequestBody requestBody)
  {
    if (IcPairing == null)
    {
      throw new Exception("No paired account");
    }
    var icPairing = IcPairing.Value;

    var dappKeypair = new KeyPair(
      Convert.FromBase64String(icPairing.dappEd25519PublicKeyB64),
      Convert.FromBase64String(icPairing.dappEd25519SecretKeyB64)
    );
    var accountTransportPublicKey = Convert.FromBase64String(icPairing.accountTransportEd25519PublicKeyB64);

    var builder = new ICSecuredEnvelopeBuilder(dappKeypair, accountTransportPublicKey);
    var envelope = builder.encryptAndSignEnvelope(
      icPairing.currSequenceNumber,
      new
      {
        newtorkName = "testnet",
        requestType = type,
      }, requestBody);

    var serializedRequestBody = JsonConvert.SerializeObject(envelope);

    var requestContent = new StringContent(serializedRequestBody, Encoding.UTF8, "application/json");
    var response = await _httpClient.PostAsync($"{BASE_URL}/v1/pairing/{icPairing.pairingId}/signing-request", requestContent);
    var serializedResponseBody = await response.Content.ReadAsStringAsync();
    var responseBody = JsonConvert.DeserializeObject<JObject>(serializedResponseBody);

    if (response.StatusCode != HttpStatusCode.OK)
    {
      Debug.Log(responseBody);
      throw new HttpRequestException(responseBody.Value<string>("message"));
    }
  }

  public async Task connect()
  {
    if (IcPairing == null)
    {
      throw new Exception("No paired account");
    }
    var icPairing = IcPairing.Value;

    var dappKeypair = new KeyPair(
      Convert.FromBase64String(icPairing.dappEd25519PublicKeyB64),
      Convert.FromBase64String(icPairing.dappEd25519SecretKeyB64)
    );

    await this.createSigningRequest("SIGN_MESSAGE", new
    {

    });

    // var publicKeyB64 = Convert.ToBase64String(dappKeypair.PublicKey);
    // string pairingId = await this.createPairingRequest(publicKeyB64);
  }

  public async Task disconnect()
  {
    IcPairing = null;
  }

  public bool isConnected
  {
    get => IcPairing != null;
  }
}
