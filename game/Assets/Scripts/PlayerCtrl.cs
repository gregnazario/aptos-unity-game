using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class PlayerCtrl : MonoBehaviour
{
  public GameObject brokenPlanePrefab;

  private void OnTriggerEnter2D(Collider2D other)
  {
    this.blowUp(other.transform);
  }

  private void blowUp(Transform missile)
  {
    // Disable main sprite renderer
    var spriteRenderer = this.GetComponentInChildren<SpriteRenderer>();
    spriteRenderer.gameObject.SetActive(false);

    GameObject brokenPlane = GameObject.Instantiate(brokenPlanePrefab, this.transform.position, this.transform.rotation, this.transform);

    foreach (Transform child in brokenPlane.transform)
    {
      var partRigidbody = child.GetComponent<Rigidbody2D>();
      var forceDirection = (Vector2)missile.position - partRigidbody.position;
      partRigidbody.AddForce(forceDirection * -5f, ForceMode2D.Impulse);
    }

    SendMessageUpwards("OnPlayerExploded", SendMessageOptions.DontRequireReceiver);
  }
}
