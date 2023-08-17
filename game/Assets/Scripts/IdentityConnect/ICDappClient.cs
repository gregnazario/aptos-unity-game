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

public class ICCrypto
{
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
    this.senderX25519SecretKeyB64 = Convert.ToBase64String(this.senderX25519KeyPair.SecretKey);
    this.senderX25519PublicKeyB64 = Convert.ToBase64String(this.senderX25519KeyPair.PublicKey);
  }

  private dynamic constructMetadata()
  {
    var sequence = 0;
    var timestampMillis = new DateTimeOffset(DateTime.Now.ToUniversalTime()).ToUnixTimeMilliseconds();
    return new
    {
      this.receiverEd25519PublicKey,
      this.senderEd25519PublicKeyB64,
      this.senderX25519PublicKeyB64,
      sequence,
      timestampMillis,
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

  public dynamic signAndEncryptEnvelope<TPublic, TPrivate>(TPublic publicMessage, TPrivate privateMessage)
  {
    var metadata = this.constructMetadata();
    var (nonce, secured) = encryptObject(privateMessage);
    var nonceB64 = Convert.ToBase64String(nonce);
    var securedB64 = Convert.ToBase64String(nonce);
    var encryptedPrivateMessage = new { nonceB64, securedB64 };

    JObject jsonPublicMessage = JObject.FromObject(publicMessage);
    // jsonPublicMessage["_metadata"] = metadata;

    var serializedPublicMessage = JsonConvert.SerializeObject(jsonPublicMessage);
    // var serializedMetadata = JsonConvert.SerializeObject(metadata);

    var messageSignature = "";

    return new
    {
      encryptedPrivateMessage,
      messageSignature,
      serializedPublicMessage
    };
  }

}

public class ICDappClient
{
  private const string DAPP_ID = "12345678-b4e1-4ddf-9c59-3b406b5b5e2a";
  private const string DAPP_HOSTNAME = "https://aptos-star-fighter.com";
  private const string BASE_URL = "https://identity-connect.staging.gcp.aptosdev.com";

  private HttpClient _httpClient = new HttpClient();

  private static ICPairingData? IcPairing
  {
    get => GameState.Get<ICPairingData>("icPairing");
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

  private async Task<string> createSigningRequest(string type, object requestBody)
  {
    var pairingId = "";
    var serializedRequestBody = JsonConvert.SerializeObject(new
    {

    });
    var requestContent = new StringContent(serializedRequestBody, Encoding.UTF8, "application/json");
    var response = await _httpClient.PostAsync($"{BASE_URL}/v1/pairing/${pairingId}/signing-request", requestContent);
    var serializedResponseBody = await response.Content.ReadAsStringAsync();
    var responseBody = JsonConvert.DeserializeObject<JObject>(serializedResponseBody);

    if (response.StatusCode != HttpStatusCode.OK)
    {
      throw new HttpRequestException(responseBody.Value<string>("message"));
    }

    return responseBody["data"]["pairing"].Value<string>("id");
  }

  public async Task connect()
  {
    var keypair = TweetNaCl.TweetNaCl.CryptoBoxKeypair();
    var publicKeyB64 = Convert.ToBase64String(keypair.PublicKey);
    // string pairingId = await this.createPairingRequest(publicKeyB64);
    // Debug.Log(pairingId);


    var receiverKeypair = TweetNaCl.TweetNaCl.CryptoBoxKeypair();
    var builder = new ICSecuredEnvelopeBuilder(keypair, receiverKeypair.PublicKey);
    var result = builder.signAndEncryptEnvelope(new
    {
      publicField = "very public"
    }, new
    {
      privateField = "incredibly private"
    });
    // Debug.Log(result);
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
