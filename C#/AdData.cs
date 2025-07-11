using UnityEditor;
using UnityEngine;

namespace Zego.Advertisement.Max
{
    [System.Serializable]
    internal class AdData
    {
        [SerializeField] internal AdUnitData DefaultAdUnitData;
        [SerializeField] internal BFSuperConfig BidfloorConfig;

        internal bool IsDefaultConfigValid()
        {
            return true;
        }

        internal bool IsBidfloorConfigValid()
        {
            return true;
        }
    }

#if UNITY_EDITOR
    static class AdDataExportTool
    {
        public static string ExportToJson(AdData adData)
        {
            var json = JsonUtility.ToJson(adData, true);
            Debug.Log(json);
            // copy to clipboard
            EditorGUIUtility.systemCopyBuffer = json;
            return json;
        }
    }
#endif
}