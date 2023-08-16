using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class MissileCtrl : MonoBehaviour
{
  public GameObject dustPrefab;
  public GameObject explosionEffectPrefab;

  public Transform target;
  public float speed = 6f;
  public float rotationSpeed = 120f;
  public float dustWait = .05f;

  private Rigidbody2D _rigidbody;

  // Use this for initialization
  void Start()
  {
    this._rigidbody = GetComponent<Rigidbody2D>();
    StartCoroutine(makingDust());
  }

  void FixedUpdate()
  {
    this._rigidbody.velocity = transform.up * speed;
    if (target != null)
    {
      Vector2 direction = (Vector2)target.position - this._rigidbody.position;
      direction.Normalize();
      float angle = Vector3.Cross(direction, transform.up).z;
      this._rigidbody.angularVelocity = -rotationSpeed * angle;
    }
  }

  IEnumerator makingDust()
  {
    while (gameObject)
    {
      yield return new WaitForSeconds(dustWait);
      GameObject dustTemp = GameObject.Instantiate(this.dustPrefab, transform.position, this.dustPrefab.transform.rotation);
      GameObject.Destroy(dustTemp, 4f);
    }
  }

  void OnTriggerEnter2D(Collider2D other)
  {
    blowUpSelf();
  }

  void blowUpSelf()
  {
    GameObject tempExplosion = GameObject.Instantiate(this.explosionEffectPrefab, transform.position, this.explosionEffectPrefab.transform.rotation);
    GameObject.Destroy(tempExplosion, 1.2f);
    GameObject.Destroy(gameObject);
  }
}
