using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;

public class LoginPageCtrl : MonoBehaviour
{
  private ICDappClient _icDappClient = new ICDappClient();
  private void Start()
  {
    // if (_icDappClient.isConnected)
    // {
    //   SceneManager.LoadScene("MainMenu");
    // }
  }

  public async void Login()
  {
    await _icDappClient.connect();
    // SceneManager.LoadScene("MainMenu");
  }
}
