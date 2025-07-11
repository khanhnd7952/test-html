using System;
using UnityEngine;

namespace Zego.Advertisement.Max
{
    [Serializable]
    internal class BFSuperConfig
    {
        [SerializeField] internal BFSuperAdUnitConfig Interstitial;
        [SerializeField] internal BFSuperAdUnitConfig Rewarded;
        [SerializeField] internal string Banner;
    }
}