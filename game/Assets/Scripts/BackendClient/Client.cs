using System;
using System.Text;
using System.Threading.Tasks;
using System.Net.Http;
using Newtonsoft.Json;
using System.Net;
using Newtonsoft.Json.Linq;
using UnityEngine;

public struct SigningInfo
{
  public SigningInfo(string signingMessage, string nonce)
  {
    this.signingMessage = signingMessage;
    this.nonce = nonce;
  }

  private string signingMessage { get; }
  private string nonce { get; }
}

public struct AuthToken
{
  public AuthToken(string token)
  {
    this.token = token;
  }

  private string token { get; }
}

public struct TxnHash
{
  public TxnHash(string hash)
  {
    this.hash = hash;
  }

  private string hash { get; }
}

public class BackendClient
{
  private const string BASE_URL = "http://localhost";

  private HttpClient _httpClient = new HttpClient();

  private static string SESSION_ID = null;


  public BackendClient()
  {
  }

  public async Task<SigningInfo> createSession(string address, bool newSession = true)
  {
    var path = "/create";
    var query = $"?accountAddress=${address}&newSession=${newSession}";
    var body = new { };

    var response = await post(body, path, query);
    return new SigningInfo(response.Value<string>("signingMessage"), response.Value<string>("nonce"));
  }

  public async Task<AuthToken> login(string address, string message, string signature, string publicKey)
  {
    var path = "/login";
    var query = "";
    var body = new
    {
      accountAddress = address,
      message = message,
      publicKey = publicKey,
      signature = signature,
    };

    var response = await post(body, path, query);
    return new AuthToken(response.Value<string>("authNonce"));
  }

  public async Task<TxnHash> endGame(string address, AuthToken authToken, UInt64 gameTime)
  {
    var path = "/endGame";
    var query = $"?accountAddress=${address}&authToken=${authToken}";
    var body = new { gameTime = gameTime };

    var response = await post(body, path, query);

    return new TxnHash(response.Value<string>("hash"));
  }

  public async Task<TxnHash> mintBody(string address, AuthToken authToken)
  {
    var path = "/mint/body";
    var query = $"?accountAddress=${address}&authToken=${authToken}";
    var body = new { };

    var response = await post(body, path, query);

    return new TxnHash(response.Value<string>("hash"));
  }

  public async Task<TxnHash> mintWing(string address, AuthToken authToken)
  {
    var path = "/mint/wing";
    var query = $"?accountAddress=${address}&authToken=${authToken}";
    var body = new { };

    var response = await post(body, path, query);

    return new TxnHash(response.Value<string>("hash"));
  }

  public async Task<TxnHash> mintFighter(string address, AuthToken authToken)
  {
    var path = "/mint/fighter";
    var query = $"?accountAddress=${address}&authToken=${authToken}";
    var body = new { };

    var response = await post(body, path, query);

    return new TxnHash(response.Value<string>("hash"));
  }

  public async Task<TxnHash> swap(string address, AuthToken authToken, string fighter, string wing = null,
    string body = null)
  {
    var path = "/swap";
    var query = $"?accountAddress=${address}&authToken=${authToken}";
    var input = new
    {
      owner = address,
      fighter = fighter,
      wing = wing,
      body = body
    };

    var response = await post(input, path, query);

    return new TxnHash(response.Value<string>("hash"));
  }

  public async Task<UInt64>

  public async void logout(string address, AuthToken authToken)
  {
    var path = "/logout";
    var query = $"?accountAddress=${address}&authToken=${authToken}";
    var body = new { };

    await post(body, path, query);
  }

  private async Task<JObject> get(string path, string query)
  {
    var response = await this._httpClient.GetAsync($"{BASE_URL}/${path}${query}");
    var serializedResponseBody = await response.Content.ReadAsStringAsync();
    var responseBody = JsonConvert.DeserializeObject<JObject>(serializedResponseBody);

    if (response.StatusCode != HttpStatusCode.OK)
    {
      throw new HttpRequestException(responseBody.Value<string>("message"));
    }

    return responseBody;
  }

  private async Task<JObject> post(object body, string path, string query)
  {
    var serializedBody = JsonConvert.SerializeObject(body);
    var content = new StringContent(serializedBody, Encoding.UTF8, "application/json");
    var response = await this._httpClient.PostAsync($"{BASE_URL}/${path}${query}", content);
    var serializedResponseBody = await response.Content.ReadAsStringAsync();
    var responseBody = JsonConvert.DeserializeObject<JObject>(serializedResponseBody);

    if (response.StatusCode != HttpStatusCode.OK)
    {
      throw new HttpRequestException(responseBody.Value<string>("message"));
    }

    return responseBody;
  }
}
