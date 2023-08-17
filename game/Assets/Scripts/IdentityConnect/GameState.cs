using System;
using System.Collections;
using System.Collections.Generic;
using System.Runtime.Serialization.Formatters.Binary;
using UnityEngine;
using Newtonsoft.Json;

[Serializable]
public struct ICPairingData
{
  public string pairingId;
  public string accountAddress;
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
