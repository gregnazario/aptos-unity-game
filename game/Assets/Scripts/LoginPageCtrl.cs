using Aptos.Accounts;
using Org.BouncyCastle.Utilities.Encoders;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.SceneManagement;
using System.Threading;

public class LoginPageCtrl : MonoBehaviour
{
  private ICDappClient _icDappClient = new ICDappClient();
  public BackendClient backendClient = new BackendClient();

  private void Start()
  {
    // if (_icDappClient.isConnected)
    // {
    //   SceneManager.LoadScene("MainMenu");
    // }
  }

  public async void Login()
  {
    //await _icDappClient.connect();
    // TODO replace this with identity connect or a WebGL hook
    var account = new Account();
    await backendClient.faucet(account.AccountAddress.ToString());

    // TODO: Sleep?
    Thread.Sleep(1000);

    // Request a session
    var session = await backendClient.createSession(account.AccountAddress.ToString());

    // Remove 0x from front and sign it
    var signingMessage = session.signingMessage.Substring(2);
    var signature = account.Sign(Hex.Decode(signingMessage));

    // Login with the signature
    await backendClient.login( signingMessage, Hex.ToHexString(signature), account.PublicKey);
    SceneManager.LoadScene("MainMenu");
  }
}
