using UnityEngine;

public class GameCtrl : MonoBehaviour
{
  private void OnPlayerExploded()
  {
    BroadcastMessage("OnGameEnd", SendMessageOptions.DontRequireReceiver);
  }
}
