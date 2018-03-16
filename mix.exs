defmodule BlueHarvest.MixProject do
  use Mix.Project

  def project do
    [
      app: :blue_harvest,
      version: "0.1.0",
      elixir: "~> 1.6",
      start_permanent: Mix.env() == :prod,
      deps: deps()
    ]
  end

  # Run "mix help compile.app" to learn about applications.
  def application do
    [
      mod: {BlueHarvest.Application, []},
      extra_applications: [:logger]
    ]
  end

  # Run "mix help deps" to learn about dependencies.
  defp deps do
    [
      # HTTP Client
      {:httpoison, "~> 1.0"},
      # HTTP Web server
      {:cowboy, "~> 1.1"},
      # Plug is:
      #   1. A specification for composable modules between web applications
      #   2. Connection adapters for different web servers in the Erlang VM
      {:plug, "~> 1.4.5"},
      # JSON encoding/decoding
      {:jason, "~> 1.0"},
      # HTML Parse/Search/Select
      {:floki, "~> 0.20.0"},
      # Help us properly distill links down the vital "host + top-level-domain"
      {:domainatrex, "~> 2.1.2"},
      ######################################################
      # Deps listed below are only needed for the AWIS API #
      ######################################################
      # AWS Request Signing
      {:sigaws, "~> 0.7"},
      # XML Parser
      {:quinn, "~> 1.1.2"},
      # Release
      {:distillery, "~> 1.0.0"}
    ]
  end
end
