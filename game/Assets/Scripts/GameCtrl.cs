using UnityEngine;
using UnityEngine.UI;
using UnityEngine.SceneManagement;
using System;

public class GameCtrl : MonoBehaviour
{
  public Canvas endGameUi;
  private BackendClient client = new BackendClient();
  private long startTime = now();
  [SerializeField] private Text _text;

  public long totalTime = 0;

  private async void OnPlayerExploded()
  {
    var currentTime = now();
    totalTime = currentTime - startTime;
    BroadcastMessage("OnGameEnd", SendMessageOptions.DontRequireReceiver);
    _text.text = $"Survived {totalTime} ms...\n Try again?";
    this.endGameUi.gameObject.SetActive(true);

    var maybePilot = GameState.Get<Pilot>("pilot");
    if (maybePilot is null)
    {
      throw new Exception("No pilot set");
    }

    var pilot = (Pilot)maybePilot;
    await client.endGame(totalTime, pilot.pilotAddress);
  }

  public void restart()
  {
    SceneManager.LoadScene("Game");
  }

  public void mainMenu()
  {
    SceneManager.LoadScene("MainMenu");
  }

  private static long now()
  {
    DateTimeOffset now = DateTimeOffset.UtcNow;
    return now.ToUnixTimeMilliseconds();
  }
}
