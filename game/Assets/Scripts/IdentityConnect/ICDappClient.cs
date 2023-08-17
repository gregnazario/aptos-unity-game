using System;
using System.Threading.Tasks;

public class ICDappClient
{
  public async Task connect()
  {
    GameState.icPairing = new ICPairingData
    {
      pairingId = "pairingId",
      accountAddress = "0xb0b"
    };
  }

  public async Task disconnect()
  {
    GameState.icPairing = null;
  }

  public bool isConnected
  {
    get => GameState.icPairing != null;
  }
}
