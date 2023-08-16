using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;

public class CameraBehaviour : MonoBehaviour
{

  public Transform target;
  public GameObject canvas;
  public GameObject missilePrefab;
  public float speed = 5f;
  public bool gameOver;
  Vector3 offSet;
  // Use this for initialization
  void Start()
  {
    offSet = target.position - transform.position;
    StartCoroutine(startAnimation());
  }

  // Update is called once per frame
  void LateUpdate()
  {
    if (!gameOver) transform.position = Vector3.Lerp(transform.position, target.position - offSet, speed * Time.deltaTime);
  }

  IEnumerator missileSpawner()
  {
    while (!gameOver)
    {
      int j = 0;
      int i = 0;
      if (target.rotation.z < 180)
      {
        i = 10;
        j = 8;
      }
      else
      {
        i = -10;
        j = -8;
      }
      Vector3 spawnPosition = target.position + new Vector3(Random.Range(j, i), Random.Range(j, i), 0f);
      GameObject missileTemp = Instantiate(missilePrefab, spawnPosition, missilePrefab.transform.rotation);
      missileTemp.GetComponent<MissileBehaviour>().target = target;
      yield return new WaitForSeconds(Random.Range(3f, 5f));
    }
  }


  IEnumerator startAnimation()
  {
    yield return new WaitForSeconds(2f);
    canvas.SetActive(false);
    StartCoroutine(missileSpawner());
  }

  public void restart()
  {
    SceneManager.LoadScene("Main");
  }
}
