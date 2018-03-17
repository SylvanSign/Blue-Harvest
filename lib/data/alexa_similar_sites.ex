require Logger

defmodule Data.AlexaSiteInfo do
  use Agent

  @name __MODULE__
  @similar :"#{@name}-similar"
  @ranks :"#{@name}-ranks"
  @site_info_url "https://www.alexa.com/find-similar-sites/data?site="
  @timeout_ms 10_000

  def start_link([]) do
    Agent.start_link(fn ->
      {:ok, @similar} = Util.PersistentCache.load(@similar)
      {:ok, @ranks} = Util.PersistentCache.load(@ranks)
      :ok
    end)
  end

  def get_similar_sites(url) do
    case Util.PersistentCache.get(@similar, url) do
      nil ->
        update_caches(url)
        Util.PersistentCache.get(@similar, url)

      similar_sites ->
        Logger.info("Serving '#{url}' - Alexa info - from cache")
        similar_sites
    end
  end

  defp update_caches(url) do
    Logger.info("Cache miss - '#{url}' - Alexa info - Fetching.")
    {alexa_ranks, similar_sites_with_similarity_ranks} = fetch_data_from_alexa(url)
    Util.PersistentCache.put_many(@ranks, alexa_ranks)
    Util.PersistentCache.put(@similar, url, similar_sites_with_similarity_ranks)
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
      Map.put(similar_sites_with_alexa_ranks, host, main_site_info["alexa_rank"])
      |> Map.to_list()

    {alexa_ranks, similar_sites_with_similarity_ranks}
  end
end
