using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;

public class MainMenuPageCtrl : MonoBehaviour
{
  public async void Disconnect()
  {
    var icDappClient = new ICDappClient();
    await icDappClient.disconnect();
    var backend = new BackendClient();
    SceneManager.LoadScene("Login");
    await backend.logout();
  }

  public void PlayNewGame()
  {
    Debug.Log("Clicked");
    SceneManager.LoadScene("Game");
  }
}
