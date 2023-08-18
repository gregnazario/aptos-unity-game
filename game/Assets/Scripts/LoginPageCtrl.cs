using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;

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
    // TODO load address from somewhere
    var address = "0x72051a1da89698e7cf185d8e1e6a2c9a8835337d3d7015f97f054e2e4864d15a";
    var session = await backendClient.createSession(address);
    await backendClient.login( "a", "a", "a");
    SceneManager.LoadScene("MainMenu");
  }
}
