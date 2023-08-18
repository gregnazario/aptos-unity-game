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
    var address = "0xcbe965f307860ed268ec1820534d2395c8fc0941059128398567228de5cecef6";
    var session = await backendClient.createSession(address);
    await backendClient.login( "a", "a", "a");
    SceneManager.LoadScene("MainMenu");
  }
}
