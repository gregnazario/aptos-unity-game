using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class GameController : MonoBehaviour
{
    public GameObject missilePrefab;
    public GameObject[] cloudPrefabs;

    // Start is called before the first frame update
    void Start()
    {

    }

    // Update is called once per frame
    void Update()
    {

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
}
