using System;
using UnityEngine;

namespace Zego
{
    [Serializable]
    class AdUnitData
    {
        [SerializeField] internal string interstitialId;
        [SerializeField] internal string rewardedVideoId;
        [SerializeField] internal string bannerId;
        [SerializeField] internal string aoaId;
    }
}