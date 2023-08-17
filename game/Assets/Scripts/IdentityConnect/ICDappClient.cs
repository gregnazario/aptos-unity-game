using System;
using System.Threading.Tasks;

public class ICDappClient
{
  private static ICPairingData? IcPairing
  {
    get => GameState.Get<ICPairingData>("icPairing");
    set => GameState.Set<ICPairingData>("icPairing", value);
  }

  public async Task connect()
  {
    IcPairing = new ICPairingData
    {
      pairingId = "pairingId",
      accountAddress = "0xb0b"
    };
  }

  public async Task disconnect()
  {
    IcPairing = null;
  }

  public bool isConnected
  {
    get => IcPairing != null;
  }
}
