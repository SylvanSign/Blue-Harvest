require Logger

defmodule Data.AlexaSimilarSites do
  use GenServer

  @name __MODULE__
  @state_file "data/#{@name}.state"
  @site_info_url "https://www.alexa.com/find-similar-sites/data?site="
  @timeout_ms 10_000

  ##############
  # PUBLIC API #
  ##############
  def start_link([]) do
    GenServer.start_link(@name, :ok, name: @name)
  end

  def get_similar_sites(url) do
    GenServer.call(@name, {:get_similar_sites, url})
  end

  # TODO remove this function after thouroughly testing this module
  def inspect_state do
    GenServer.call(@name, :inspect)
  end

  ####################
  # SERVER CALLBACKS #
  ####################
  def init(:ok) do
    state = load_state()

    {:ok, state}
  end

  def handle_call({:get_similar_sites, url}, _from, state = {similar, ranks}) do
    host = Util.URL.parse(url)

    case Map.get(similar, host) do
      nil ->
        Logger.info("Cache miss - '#{host}' - Alexa info - Fetching.")

        {alexa_ranks, similar_sites_with_similarity_ranks} = fetch_data_from_alexa(host)

        ranks = Map.merge(ranks, alexa_ranks)

        similar = Map.put(similar, host, similar_sites_with_similarity_ranks)

        state = {similar, ranks}
        save_state(state)
        {:reply, similar[host], state}

      similar_sites ->
        Logger.info("Serving '#{host}' - Alexa info - from cache")
        {:reply, similar_sites, state}
    end
  end

  def handle_call(:inspect, _from, state) do
    {:reply, state, state}
  end

  ###################
  # PRIVATE HELPERS #
  ###################
  defp load_state() do
    case File.read(@state_file) do
      {:ok, saved_state} -> :erlang.binary_to_term(saved_state)
      {:error, :enoent} -> {%{}, %{}}
    end
  end

  defp save_state(state) do
    binary_state = :erlang.term_to_binary(state)
    File.write!(@state_file, binary_state)
  end

  defp fetch_data_from_alexa(host) do
    [main_site_info | similar_sites_info] =
      HTTPoison.get!(@site_info_url <> host, %{}, recv_timeout: @timeout_ms)
      |> Map.get(:body)
      |> Jason.decode!()
      |> Map.get("results")
      |> Enum.filter(&Map.has_key?(&1, "site2"))

    similar_sites_with_similarity_ranks =
      Enum.reduce(similar_sites_info, %{}, fn site_entry, rankings ->
        Map.put(rankings, site_entry["site2"], site_entry["overlap_score"])
      end)

    similar_sites_with_alexa_ranks =
      Enum.reduce(similar_sites_info, %{}, fn site_entry, rankings ->
        Map.put(rankings, site_entry["site2"], site_entry["alexa_rank"])
      end)

    alexa_ranks =
      Map.merge(similar_sites_with_alexa_ranks, %{host => main_site_info["alexa_rank"]})

    {alexa_ranks, similar_sites_with_similarity_ranks}
  end
end