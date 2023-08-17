using System;
using System.Collections;
using System.Collections.Generic;
using System.Runtime.Serialization.Formatters.Binary;
using UnityEngine;
using Newtonsoft.Json;

[Serializable]
public struct ICPairingData
{
  public string accountAddress;
  public string accountEd25519PublicKeyB64;
  public string accountTransportEd25519PublicKeyB64;
  public string currSequenceNumber;
  public string dappEd25519PublicKeyB64;
  public string dappEd25519SecretKeyB64;
  public string pairingId;
}

public static class GameState
{

  public static T? Get<T>(string key) where T : struct
  {
    return PlayerPrefs.HasKey(key)
     ? JsonConvert.DeserializeObject<T>(PlayerPrefs.GetString(key))
     : null;
  }

  public static void Set<T>(string key, T? value) where T : struct
  {
    if (value != null)
    {
      PlayerPrefs.SetString(key, JsonConvert.SerializeObject(value));
    }
    else
    {
      PlayerPrefs.DeleteKey(key);
    }
  }
}
