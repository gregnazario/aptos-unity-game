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
    SceneManager.LoadScene("Login");
  }

  public void PlayNewGame()
  {
    Debug.Log("Clicked");
    SceneManager.LoadScene("Game");
  }
}
