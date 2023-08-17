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
  public static ICPairingData? icPairing
  {
    get
    {
      return PlayerPrefs.HasKey("icPairing")
      ? JsonConvert.DeserializeObject<ICPairingData>(PlayerPrefs.GetString("icPairing"))
      : null;
    }
    set
    {
      if (value != null)
      {
        PlayerPrefs.SetString("icPairing", JsonConvert.SerializeObject(value));
      }
      else
      {
        PlayerPrefs.DeleteKey("icPairing");
      }
    }
  }
}
