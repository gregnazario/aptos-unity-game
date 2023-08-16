using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class BackgroundConroller : MonoBehaviour
{
  public GameObject[] cloudPrefabs;

  // Start is called before the first frame update
  private void Start()
  {
    makeClouds();
  }

  void makeClouds()
  {
    for (int i = -40; i < 40; i += (int)Random.Range(5, 8))
    {
      for (int j = -40; j < 40; j += (int)Random.Range(5, 8))
      {
        var cloudPrefab = this.cloudPrefabs[Random.Range(0, cloudPrefabs.Length)];
        var position = new Vector3(i, j, 0f);
        var rotation = Quaternion.identity;
        GameObject.Instantiate(cloudPrefab, position, rotation, this.transform);
      }
    }
  }
}
