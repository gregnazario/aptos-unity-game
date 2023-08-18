using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.SceneManagement;

public class MainMenuPageCtrl : MonoBehaviour
{
  [SerializeField] private Text _gamesPlayed;
  [SerializeField] private Text _maxTime;
  [SerializeField] private Text _balance;

  public async void Start()
  {
    var client = new BackendClient();
    var (gamesPlayed, maxTime) = await client.pilot();
    _gamesPlayed.text = $"{gamesPlayed}";
    _maxTime.text = $"{maxTime} ms";
    _balance.text = $"{await client.balance() / 100000000.0} APT";
  }

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
