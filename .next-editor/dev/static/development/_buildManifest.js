self.__BUILD_MANIFEST = {
  "__rewrites": {
    "afterFiles": [
      {
        "source": "/game/:path*"
      },
      {
        "source": "/_next/static/:path*"
      },
      {
        "source": "/assets/:path*"
      },
      {
        "source": "/__nextjs_original-stack-frames"
      }
    ],
    "beforeFiles": [],
    "fallback": []
  },
  "sortedPages": [
    "/_app",
    "/_error"
  ]
};self.__BUILD_MANIFEST_CB && self.__BUILD_MANIFEST_CB()