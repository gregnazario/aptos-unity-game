using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;

public class MainMenuCtrl : MonoBehaviour
{
  public void PlayNewGame()
  {
    Debug.Log("Clicked");
    SceneManager.LoadScene("Main");
  }
}
