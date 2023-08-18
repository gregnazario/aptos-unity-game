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
  private const string BASE_URL = "http://localhost:8080";

  private HttpClient _httpClient = new HttpClient();

  public static string accountAddress = null;
  public static string staticAuthToken = null;
  public static string RECORDS_ADDRESS = "0xcf64ac35cde36dd01e41d2f5a894c8a6708bcde336be645a55006eb93042f53e";
  public static string PILOT_ADDRESS = "0x18d3ef9c784efad3824667dcd75524b4ae8e3aafc914a7e87fcc7a18c091cdb5";


  public BackendClient()
  {
  }

  public async Task<SigningInfo> createSession(string address)
  {
    var path = "create";
    var query = $"accountAddress={address}&newSession=true";
    var body = new { };
    accountAddress = address;

    var response = await post(body, path, query);
    return new SigningInfo(response.Value<string>("signingMessage"), response.Value<string>("nonce"));
  }

  public async Task<string> login(string message, string signature, string publicKey)
  {
    var path = "login";
    var query = $"accountAddress={accountAddress}&message={message}&signature={signature}&publicKey={publicKey}";
    var body = new
    {
      accountAddress = accountAddress,
      message = message,
      publicKey = publicKey,
      signature = signature,
    };

    var response = await post(body, path, query);
    var authToken = response.Value<string>("authToken");
    staticAuthToken = authToken;
    return authToken;
  }

  public async Task<TxnHash> endGame(long gameTime, string pilotAddress)
  {
    var path = "endGame";
    var query = $"accountAddress={accountAddress}&authToken={staticAuthToken}";
    var body = new { gameTime = gameTime, pilot = pilotAddress };

    var response = await post(body, path, query);

    return new TxnHash(response.Value<string>("hash"));
  }

  public async Task<TxnHash> mintPilot()
  {
    var path = "mint/pilot";
    var query = $"accountAddress={accountAddress}&authToken={staticAuthToken}";
    var body = new { };

    var response = await post(body, path, query);

    return new TxnHash(response.Value<string>("hash"));
  }

  public async Task<TxnHash> mintBody()
  {
    var path = "mint/body";
    var query = $"accountAddress={accountAddress}&authToken={staticAuthToken}";
    var body = new { };

    var response = await post(body, path, query);

    return new TxnHash(response.Value<string>("hash"));
  }

  public async Task<TxnHash> mintWing()
  {
    var path = "mint/wing";
    var query = $"accountAddress={accountAddress}&authToken={staticAuthToken}";
    var body = new { };

    var response = await post(body, path, query);

    return new TxnHash(response.Value<string>("hash"));
  }

  public async Task<TxnHash> mintFighter()
  {
    var path = "mint/fighter";
    var query = $"accountAddress={accountAddress}&authToken={staticAuthToken}";
    var body = new { };

    var response = await post(body, path, query);

    return new TxnHash(response.Value<string>("hash"));
  }

  public async Task<TxnHash> swap(string fighter, string wing = null,
    string body = null)
  {
    var path = "swap";
    var query = $"accountAddress={accountAddress}&authToken={staticAuthToken}";
    var input = new
    {
      owner = accountAddress,
      fighter = fighter,
      wing = wing,
      body = body
    };

    var response = await post(input, path, query);

    return new TxnHash(response.Value<string>("hash"));
  }

  public async Task<int> logout()
  {
    var path = "logout";
    var query = $"accountAddress={accountAddress}&authToken={staticAuthToken}";
    var body = new { };
    await post(body, path, query);
    staticAuthToken = null;
    accountAddress = null;
    return 0;
  }

  public async Task<(long, long)> pilot()
  {
    var path = "pilot";
    var query = $"accountAddress={PILOT_ADDRESS}";
    var response = await get(path, query);
    return (response.Value<long>("gamesPlayed"), response.Value<long>("longestSurvival"));
  }

  private async Task<JObject> get(string path, string query)
  {
    var response = await this._httpClient.GetAsync($"http://localhost:8080/{path}?{query}");
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
    var response = await this._httpClient.PostAsync($"http://localhost:8080/{path}?{query}", content);
    var serializedResponseBody = await response.Content.ReadAsStringAsync();
    var responseBody = JsonConvert.DeserializeObject<JObject>(serializedResponseBody);

    if (response.StatusCode != HttpStatusCode.OK)
    {
      throw new HttpRequestException(responseBody.Value<string>("message"));
    }

    return responseBody;
  }
}
