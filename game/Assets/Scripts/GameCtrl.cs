using UnityEngine;
using UnityEngine.SceneManagement;

public class GameCtrl : MonoBehaviour
{
  public Canvas endGameUi;

  private void OnPlayerExploded()
  {
    BroadcastMessage("OnGameEnd", SendMessageOptions.DontRequireReceiver);
    this.endGameUi.gameObject.SetActive(true);
  }

  public void restart()
  {
    SceneManager.LoadScene("Main");
  }
}
