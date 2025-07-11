using System;
using System.Collections.Generic;
using UnityEngine;

namespace Zego.Advertisement.Max
{
    [Serializable]
    internal class BFSuperAdUnitConfig
    {
        [SerializeField] internal string DefaultId;
        [SerializeField] internal string[] BidfloorIds;
        [SerializeField] internal int BidFloorLoadCount = 3;
        [SerializeField] internal bool BidFloorAutoRetry = false;
        [SerializeField] internal int AutoReloadInterval = 99999;


        public IEnumerable<string> AllIds
        {
            get
            {
                var ids = new List<string> { DefaultId };
                ids.AddRange(BidfloorIds);
                return ids;
            }
        }
    }
}