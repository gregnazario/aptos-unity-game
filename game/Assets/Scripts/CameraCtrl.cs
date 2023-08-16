using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;

public class CameraBehaviour : MonoBehaviour
{
  public Transform target;
  public float speed = 5f;
  private Vector3 offset;

  // Use this for initialization
  private void Start()
  {
    this.offset = this.target.position - this.transform.position;
  }

  // Update is called once per frame
  private void FixedUpdate()
  {
    transform.position = Vector3.Lerp(transform.position, target.position - this.offset, this.speed * Time.deltaTime);
  }

  private void OnGameEnd()
  {
    this.enabled = false;
  }
}
